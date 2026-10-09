import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const db = new PGlite();
describe("public marketplace PostgreSQL visibility", () => {
  beforeAll(async () => {
    for (const file of ["auth-schema.sql", "storage-schema.sql"]) await db.exec(await readFile(new URL(`../fixtures/${file}`, import.meta.url), "utf8"));
    const dir = new URL("../../supabase/migrations/", import.meta.url);
    for (const file of (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
    await db.exec(await readFile(new URL("../fixtures/marketplace.sql", import.meta.url), "utf8"));
  });
  beforeEach(async () => { await db.exec("begin"); });
  afterEach(async () => { await db.exec("rollback"); });
  afterAll(async () => { await db.close(); });

  it.each(["anon", "authenticated"])("%s sees only approved, already published listings", async (role) => {
    await db.exec(`set local role ${role}`);
    expect((await db.query("select id from public.vehicle_listings")).rows).toHaveLength(15);
    expect((await db.query("select slug from public.vehicle_listings where slug like 'hidden-%'")).rows).toEqual([]);
  });
  it("filters, counts, sorts and paginates at the database", async () => {
    await db.exec("set local role anon");
    const result = await db.query<{ model: string }>("select model from public.vehicle_listings where make='Toyota' and district='Colombo' and price_minor between 100000000 and 300000000 order by price_minor asc,id limit 1 offset 1");
    expect(result.rows).toEqual([{ model: "Prius" }]);
    expect((await db.query<{ count: number }>("select count(*)::int as count from public.vehicle_listings")).rows[0]?.count).toBe(15);
    expect((await db.query("select id from public.vehicle_listings order by published_at desc,id limit 12 offset 12")).rows).toHaveLength(3);
  });
  it("does not reveal unpublished detail slugs or media", async () => {
    await db.exec("set local role anon");
    expect((await db.query("select slug from public.vehicle_listings where slug='hidden-fixture-1'")).rows).toEqual([]);
    expect((await db.query("select id from public.vehicle_media")).rows).toHaveLength(2);
  });
  it("keeps filter suggestions limited to eligible listings", async () => {
    await db.exec("set local role anon");
    const result = await db.query<{ data: { makes: string[] } }>("select public.marketplace_facets() as data");
    expect(result.rows[0]?.data.makes).toEqual(["Suzuki", "Toyota"]);
  });
  it.each(["anon", "authenticated"])("%s cannot create, publish, alter prices or delete listings", async (role) => {
    await db.exec(`set local role ${role}`);
    await expect(db.exec("update public.vehicle_listings set status='approved' where slug='hidden-fixture-1'")).rejects.toMatchObject({ code: "42501" });
  });
  it.each(["insert into public.vehicle_listings(slug,make,model,manufacture_year,district,price_minor) values ('forged-listing','Toyota','Forged',2020,'Colombo',100)", "update public.vehicle_listings set price_minor=1", "delete from public.vehicle_listings", "insert into public.vehicle_media(listing_id,storage_path,position) values ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001/forged.png',3)"])("denies public mutations: %s", async (sql) => {
    await db.exec("set local role anon");
    await expect(db.exec(sql)).rejects.toMatchObject({ code: "42501" });
  });
  it("private photo storage exposes only approved media on eligible listings", async () => {
    await db.exec("set local role anon");
    expect((await db.query("select name from storage.objects")).rows).toHaveLength(2);
  });
  it("revoking listing visibility revokes media and storage reads", async () => {
    await db.exec("update public.vehicle_listings set status='removed' where slug='fixture-car-1'; set local role anon");
    expect((await db.query("select id from public.vehicle_media")).rows).toEqual([]);
    expect((await db.query("select name from storage.objects")).rows).toEqual([]);
  });
  it("new private columns do not inherit public SELECT privileges", async () => {
    await db.exec("alter table public.vehicle_listings add column future_private_note text; set local role anon");
    await expect(db.exec("select future_private_note from public.vehicle_listings")).rejects.toMatchObject({ code: "42501" });
  });
  it("rejects out-of-bounds money", async () => {
    await expect(db.exec("update public.vehicle_listings set price_minor=1000000000001 where slug='fixture-car-1'")).rejects.toMatchObject({ code: "23514" });
  });
  it("cannot mark a listing approved without review/publication times", async () => {
    await expect(db.exec("update public.vehicle_listings set status='approved' where slug='hidden-fixture-1'")).rejects.toMatchObject({ code: "23514" });
  });
  it("rejects arbitrary media paths and SVG uploads in the read model", async () => {
    await expect(db.exec("update public.vehicle_media set storage_path='private/nic.svg' where position=0")).rejects.toMatchObject({ code: "23514" });
  });
});
