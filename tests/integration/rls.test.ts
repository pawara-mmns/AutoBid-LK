import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const db = new PGlite();

async function asRole(role: "anon" | "authenticated" | "service_role", id = "") {
  await db.exec(`set local role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, true)", [id]);
}

describe("migrated PostgreSQL ownership and permissions", () => {
  beforeAll(async () => {
    await db.exec(await readFile(new URL("../fixtures/auth-schema.sql", import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../fixtures/storage-schema.sql", import.meta.url), "utf8"));
    const migrations = new URL("../../supabase/migrations/", import.meta.url);
    for (const file of (await readdir(migrations)).filter((name) => name.endsWith(".sql")).sort()) {
      await db.exec(await readFile(new URL(file, migrations), "utf8"));
    }
    await db.query("insert into auth.users(id, raw_user_meta_data) values ($1, $2), ($3, $4)", [
      alice, JSON.stringify({ display_name: "Alice test", role: "admin", is_admin: true }),
      bob, JSON.stringify({ display_name: "Bob test" }),
    ]);
  });
  beforeEach(async () => { await db.exec("begin"); });
  afterEach(async () => { await db.exec("rollback"); });
  afterAll(async () => { await db.close(); });

  it("creates profiles via Auth trigger but ignores forged admin metadata", async () => {
    const profiles = await db.query<{ id: string }>("select id from public.profiles order by id");
    expect(profiles.rows.map((row) => row.id)).toEqual([alice, bob]);
    expect((await db.query("select * from public.admin_grants")).rows).toEqual([]);
  });
  it.each(["profiles", "dealer_profiles", "admin_grants"])("denies anonymous reads from %s", async (table) => {
    await asRole("anon");
    await expect(db.query(`select * from public.${table}`)).rejects.toMatchObject({ code: "42501" });
  });
  it("returns no private rows for an authenticated role without an identity", async () => {
    await asRole("authenticated");
    expect((await db.query("select * from public.profiles")).rows).toEqual([]);
  });
  it("shows only the current user's private profile", async () => {
    await asRole("authenticated", alice);
    const result = await db.query<{ id: string }>("select id from public.profiles");
    expect(result.rows).toEqual([{ id: alice }]);
    expect((await db.query("select * from public.profiles where id = $1", [bob])).rows).toEqual([]);
  });
  it("allows own safe-column updates and stamps updated_at", async () => {
    await asRole("authenticated", alice);
    const result = await db.query<{ display_name: string; preferred_locale: string; updated_at: Date }>(
      "update public.profiles set display_name = 'Changed test', preferred_locale = 'si' where id = $1 returning display_name, preferred_locale, updated_at", [alice],
    );
    expect(result.rows[0]).toMatchObject({ display_name: "Changed test", preferred_locale: "si" });
    expect(result.rows[0]?.updated_at).toBeTruthy();
  });
  it("does not update another profile", async () => {
    await asRole("authenticated", alice);
    expect((await db.query("update public.profiles set display_name = 'Intruder test' where id = $1 returning id", [bob])).rows).toEqual([]);
  });
  it.each(["id = '00000000-0000-4000-8000-000000000003'", "created_at = now()", "updated_at = now()"])("denies protected profile column: %s", async (assignment) => {
    await asRole("authenticated", alice);
    await expect(db.exec(`update public.profiles set ${assignment}`)).rejects.toMatchObject({ code: "42501" });
  });
  it.each(["insert into public.profiles(id) values ('00000000-0000-4000-8000-000000000003')", "delete from public.profiles"])("denies direct profile creation/deletion: %s", async (sql) => {
    await asRole("authenticated", alice);
    await expect(db.exec(sql)).rejects.toMatchObject({ code: "42501" });
  });
  it("validates profile locale and name in PostgreSQL", async () => {
    await asRole("authenticated", alice);
    await expect(db.exec("update public.profiles set preferred_locale = 'xx'" )).rejects.toMatchObject({ code: "23514" });
  });
  it("allows an owned pending dealer request", async () => {
    await asRole("authenticated", alice);
    await db.query("insert into public.dealer_profiles(user_id, business_name) values ($1, 'Test dealer')", [alice]);
    expect((await db.query("select verification_status, verified_at from public.dealer_profiles")).rows).toEqual([{ verification_status: "pending", verified_at: null }]);
  });
  it("denies a dealer request for another user", async () => {
    await asRole("authenticated", alice);
    await expect(db.query("insert into public.dealer_profiles(user_id, business_name) values ($1, 'Test dealer')", [bob])).rejects.toMatchObject({ code: "42501" });
  });
  it("denies verification during dealer insertion", async () => {
    await asRole("authenticated", alice);
    await expect(db.query("insert into public.dealer_profiles(user_id, business_name, verification_status, verified_at) values ($1, 'Test dealer', 'verified', now())", [alice])).rejects.toMatchObject({ code: "42501" });
  });
  it("denies dealer self-verification", async () => {
    await db.query("insert into public.dealer_profiles(user_id, business_name) values ($1, 'Test dealer')", [alice]);
    await asRole("authenticated", alice);
    await expect(db.exec("update public.dealer_profiles set verification_status = 'verified', verified_at = now()" )).rejects.toMatchObject({ code: "42501" });
  });
  it("allows pending business-name edits but hides other dealer profiles", async () => {
    await db.query("insert into public.dealer_profiles(user_id, business_name) values ($1, 'Test dealer'), ($2, 'Other test dealer')", [alice, bob]);
    await asRole("authenticated", alice);
    await db.exec("update public.dealer_profiles set business_name = 'Changed test dealer'");
    expect((await db.query("select business_name from public.dealer_profiles")).rows).toEqual([{ business_name: "Changed test dealer" }]);
  });
  it("locks a verified dealer record against customer edits", async () => {
    await db.query("insert into public.dealer_profiles(user_id, business_name, verification_status, verified_at) values ($1, 'Verified test dealer', 'verified', now())", [alice]);
    await asRole("authenticated", alice);
    expect((await db.query("update public.dealer_profiles set business_name = 'Changed test dealer' returning user_id")).rows).toEqual([]);
  });
  it.each(["insert into public.admin_grants(user_id, reason) values ('00000000-0000-4000-8000-000000000001', 'Forged test')", "update public.admin_grants set reason = 'Forged test'", "delete from public.admin_grants"])("denies customer admin-grant mutation: %s", async (sql) => {
    await asRole("authenticated", alice);
    await expect(db.exec(sql)).rejects.toMatchObject({ code: "42501" });
  });
  it("permits trusted admin provisioning but exposes only the user's own grant", async () => {
    await asRole("service_role");
    await db.query("insert into public.admin_grants(user_id, reason) values ($1, 'Test-only authorized grant'), ($2, 'Second test grant')", [alice, bob]);
    await asRole("authenticated", alice);
    expect((await db.query("select user_id from public.admin_grants")).rows).toEqual([{ user_id: alice }]);
    expect((await db.query("select id from public.profiles where id = $1", [bob])).rows).toEqual([]);
  });
  it("enforces dealer verification timestamp consistency", async () => {
    await expect(db.query("insert into public.dealer_profiles(user_id, business_name, verification_status) values ($1, 'Test dealer', 'verified')", [alice])).rejects.toMatchObject({ code: "23514" });
  });
  it("cascades removed identities to their profile, dealer and grant", async () => {
    await db.query("insert into public.dealer_profiles(user_id, business_name) values ($1, 'Test dealer')", [alice]);
    await db.query("insert into public.admin_grants(user_id, reason) values ($1, 'Test grant')", [alice]);
    await db.query("delete from auth.users where id = $1", [alice]);
    for (const table of ["profiles", "dealer_profiles", "admin_grants"]) {
      expect((await db.query(`select * from public.${table} where ${table === "profiles" ? "id" : "user_id"} = $1`, [alice])).rows).toEqual([]);
    }
  });
});
