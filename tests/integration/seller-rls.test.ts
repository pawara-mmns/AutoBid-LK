import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { beforeAll, beforeEach, afterEach, afterAll, describe, it, expect } from "vitest";
import { formSchema, savePayload } from "@/features/seller-listings/schema";
const db = new PGlite();
const alice = "00000000-0000-4000-8000-000000000001", bob = "00000000-0000-4000-8000-000000000002", id = "00000000-0000-4000-8000-000000000003";
async function role(user = alice, name = "authenticated") { await db.exec(`set local role ${name}`); await db.query("select set_config('request.jwt.claim.sub', $1, true)", [user]); }
async function rpc(name: string, input: unknown) { return (await db.query<{ value: Record<string, unknown> }>(`select public.${name}($1::jsonb) as value`, [JSON.stringify(input)])).rows[0]!.value; }
async function completeDraft() {
  await role(); await rpc("seller_create_draft", { id });
  const form = formSchema.parse({ make: "Toyota", model: "Aqua", year: "2015", registered: "no", fuel: "hybrid", transmission: "automatic", mileage: "100000", district: "Colombo", town: "Nugegoda", condition: "good", accident: "no", flood: "unsure", mechanical: "no", finance: "no", expectedPrice: "3000000.25", minimumPrice: "2900000", phone: "+94771234567", registeredOwner: "yes", terms: "yes", accuracy: "yes" });
  await rpc("seller_save_draft", { id, revision: 0, ...savePayload(form) });
  for (const [index, slot] of ["front", "back", "interior", "dashboard"].entries()) { const photoId = `00000000-0000-4000-8000-00000000000${index + 4}`; const p = await rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "reserve", slot }); await db.query("insert into storage.objects(bucket_id,name) values ('seller-draft-photos',$1)", [p.storage_path]); await rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "complete" }); }
  return form;
}
describe("private seller PostgreSQL ownership", () => {
  beforeAll(async () => {
    for (const file of ["auth-schema.sql", "storage-schema.sql"]) await db.exec(await readFile(new URL(`../fixtures/${file}`, import.meta.url), "utf8"));
    const dir = new URL("../../supabase/migrations/", import.meta.url);
    for (const file of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) await db.exec(await readFile(new URL(file, dir), "utf8"));
    await db.query("insert into auth.users(id) values ($1),($2)", [alice, bob]);
  });
  beforeEach(async () => { await db.exec("begin"); }); afterEach(async () => { await db.exec("rollback"); }); afterAll(async () => { await db.close(); });
  it("creates an owned private draft idempotently", async () => { await role(); const a = await rpc("seller_create_draft", { id, owner_id: bob, status: "approved" }); expect(a.owner_id).toBe(alice); expect(a.status).toBe("draft"); expect(await rpc("seller_create_draft", { id })).toEqual(a); });
  it("saves partial details and exact private cents", async () => { await role(); await rpc("seller_create_draft", { id }); const saved = await rpc("seller_save_draft", { id, revision: 0, details: { make: "Toyota" }, expected_price_minor: 100001, minimum_price_minor: 90000 }); expect(saved.revision).toBe(1); expect(saved.minimum_price_minor).toBe(90000); });
  it("hides drafts from another customer", async () => { await role(); await rpc("seller_create_draft", { id }); await role(bob); expect((await db.query("select * from public.seller_listings")).rows).toEqual([]); await expect(rpc("seller_save_draft", { id, revision: 0, details: {} })).rejects.toMatchObject({ code: "42501" }); });
  it("denies anonymous reads and creation", async () => { await role("", "anon"); await expect(db.query("select * from public.seller_listings")).rejects.toMatchObject({ code: "42501" }); await db.exec("rollback; begin"); await role("", "anon"); await expect(rpc("seller_create_draft", { id })).rejects.toMatchObject({ code: "42501" }); });
  it("denies direct status/owner/verification writes", async () => { await role(); await rpc("seller_create_draft", { id }); await expect(db.query("update public.seller_listings set status='pending_review',submitted_at=now()")).rejects.toMatchObject({ code: "42501" }); });
  it("rejects stale revisions instead of overwriting another window", async () => { await role(); await rpc("seller_create_draft", { id }); await rpc("seller_save_draft", { id, revision: 0, details: {} }); await expect(rpc("seller_save_draft", { id, revision: 0, details: {} })).rejects.toMatchObject({ code: "40001" }); });
  it("rejects private reserve inconsistency", async () => { await role(); await rpc("seller_create_draft", { id }); await expect(rpc("seller_save_draft", { id, revision: 0, details: {}, expected_price_minor: 100, minimum_price_minor: 101 })).rejects.toMatchObject({ code: "23514" }); });
  it("rejects unknown mass-assigned draft fields", async () => { await role(); await rpc("seller_create_draft", { id }); await expect(rpc("seller_save_draft", { id, revision: 0, details: { approved: "yes" } })).rejects.toMatchObject({ code: "23514" }); });
  it("requires a revision rather than accepting a missing version", async () => { await role(); await rpc("seller_create_draft", { id }); await expect(rpc("seller_save_draft", { id, details: {} })).rejects.toMatchObject({ code: "40001" }); });
  it("enforces private owned photo reservations and Storage access", async () => {
    await role(); await rpc("seller_create_draft", { id }); const photoId = "00000000-0000-4000-8000-000000000004";
    const photo = await rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "reserve", slot: "front" });
    await db.query("insert into storage.objects(bucket_id,name) values ('seller-draft-photos',$1)", [photo.storage_path]);
    await rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "complete" });
    await rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "complete" });
    expect((await db.query("select is_cover from public.seller_listing_photos")).rows).toEqual([{ is_cover: true }]);
    expect((await db.query("select name from storage.objects")).rows).toEqual([{ name: photo.storage_path }]);
    await role(bob); expect((await db.query("select * from public.seller_listing_photos")).rows).toEqual([]); expect((await db.query("select * from storage.objects")).rows).toEqual([]);
    await expect(rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "remove" })).rejects.toMatchObject({ code: "42501" });
  });
  it("denies unreserved Storage paths and other owner uploads", async () => { await role(bob); await expect(db.query("insert into storage.objects(bucket_id,name) values ('seller-draft-photos',$1)", [`${alice}/${id}/fake.jpg`])).rejects.toMatchObject({ code: "42501" }); });
  it("never marks a missing object uploaded", async () => { await role(); await rpc("seller_create_draft", { id }); const photoId = "00000000-0000-4000-8000-000000000004"; await rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "reserve", slot: "front" }); await expect(rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "complete" })).rejects.toMatchObject({ code: "23514" }); });
  it("supports cover/order and removes metadata only after Storage deletion", async () => {
    await role(); await rpc("seller_create_draft", { id });
    const ids = ["00000000-0000-4000-8000-000000000004", "00000000-0000-4000-8000-000000000005"];
    for (const photoId of ids) { const p = await rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "reserve", slot: "front" }); await db.query("insert into storage.objects(bucket_id,name) values ('seller-draft-photos',$1)", [p.storage_path]); await rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "complete" }); }
    await rpc("seller_manage_photo", { listing_id: id, photo_id: ids[1], action: "cover" }); await rpc("seller_manage_photo", { listing_id: id, photo_id: ids[1], action: "earlier" });
    expect((await db.query("select id,is_cover from public.seller_listing_photos order by position")).rows[0]).toMatchObject({ id: ids[1], is_cover: true });
    await db.query("delete from storage.objects where name=$1", [`${alice}/${id}/${ids[1]}.jpg`]); await rpc("seller_manage_photo", { listing_id: id, photo_id: ids[1], action: "remove" });
    expect((await db.query("select id,is_cover from public.seller_listing_photos")).rows).toEqual([{ id: ids[0], is_cover: true }]);
  });
  it("submits idempotently without publishing or verifying phone/ownership", async () => {
    await completeDraft(); const submission = await rpc("seller_submit_listing", { id, revision: 1, status: "approved" });
    expect(submission).toMatchObject({ status: "pending_review", phone_verified: false, submission_terms_version: "seller-intake-2026-10-11" }); expect(submission.submitted_at).toBeTruthy();
    expect(await rpc("seller_submit_listing", { id, revision: 1 })).toEqual(submission);
    await db.exec("reset role"); expect((await db.query("select * from public.vehicle_listings")).rows).toEqual([]);
  });
  it("locks submitted details and photo management", async () => { await completeDraft(); await rpc("seller_submit_listing", { id, revision: 1 }); await expect(rpc("seller_save_draft", { id, revision: 2, details: {} })).rejects.toMatchObject({ code: "42501" }); });
  it("denies submitted Storage deletion", async () => { await completeDraft(); await rpc("seller_submit_listing", { id, revision: 1 }); expect((await db.query("delete from storage.objects where bucket_id='seller-draft-photos' returning id")).rows).toEqual([]); });
  it("denies incomplete direct submission without relying on React validation", async () => { await role(); await rpc("seller_create_draft", { id }); await expect(rpc("seller_submit_listing", { id, revision: 0 })).rejects.toMatchObject({ code: "23514" }); });
  it.each(["finance", "accident", "flood", "mechanical"])("requires %s details on direct submission", async (field) => { const f = await completeDraft(); await rpc("seller_save_draft", { id, revision: 1, ...savePayload({ ...f, [field]: "yes" }) }); await expect(rpc("seller_submit_listing", { id, revision: 2 })).rejects.toMatchObject({ code: "23514" }); });
  it("keeps private minimum price invisible to ordinary buyers", async () => { await completeDraft(); await rpc("seller_submit_listing", { id, revision: 1 }); await role(bob); expect((await db.query("select minimum_price_minor from public.seller_listings")).rows).toEqual([]); });
  it("rejects direct submission after a guided photo disappears", async () => { await completeDraft(); await db.query("delete from storage.objects where name=$1", [`${alice}/${id}/00000000-0000-4000-8000-000000000004.jpg`]); await expect(rpc("seller_submit_listing", { id, revision: 1 })).rejects.toMatchObject({ code: "23514" }); });
  it("denies another account submission", async () => { await completeDraft(); await role(bob); await expect(rpc("seller_submit_listing", { id, revision: 1 })).rejects.toMatchObject({ code: "42501" }); });
  it("persists upload rate limits even when a reservation is removed", async () => { await role(); await rpc("seller_create_draft", { id }); const photoId = "00000000-0000-4000-8000-000000000004"; await rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "reserve", slot: "front" }); await rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "remove" }); await db.exec("reset role"); await db.query("update public.seller_upload_limits set attempts=60 where owner_id=$1", [alice]); await role(); await expect(rpc("seller_manage_photo", { listing_id: id, photo_id: photoId, action: "reserve", slot: "front" })).rejects.toMatchObject({ code: "23514" }); });
});
