"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/features/auth/guards";
import { getValidatedUser } from "@/features/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formSchema, savePayload, initialForm, validateSubmission } from "./schema";
import { loadSellerListing } from "./queries";
import { loadSellerPhotos, readSellerPhoto } from "./photos";

export async function createDraft(form: FormData) {
  const { client } = await requireUser("/seller/vehicles/new");
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) redirect("/seller/vehicles/new?error=1");
  const { error } = await client.rpc("seller_create_draft", { p_input: { id: id.data } });
  if (error) redirect("/seller/vehicles/new?error=1");
  redirect(`/seller/vehicles/${id.data}`);
}

export async function submitListing(input: unknown) {
  const parsed = z.object({ id: z.uuid(), revision: z.number().int().min(0) }).strict().safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const client = await createServerSupabaseClient(); const user = client && await getValidatedUser(client); if (!client || !user) return { ok: false as const };
  try {
    const listing = await loadSellerListing(client, user.id, parsed.data.id); if (!listing) return { ok: false as const };
    if (listing.status === "pending_review") return { ok: true as const };
    if (listing.revision !== parsed.data.revision) return { ok: false as const, conflict: true };
    const photos = await loadSellerPhotos(client, listing.id); const form = initialForm(listing);
    const errors = validateSubmission(form, photos.filter((p) => p.uploaded_at).map((p) => p.slot));
    if (Object.keys(errors).length) return { ok: false as const, errors };
    // Validate actual private bytes, sequentially to keep decoder memory bounded.
    for (const photo of photos.filter((p) => p.uploaded_at)) await readSellerPhoto(client, photo, user.id);
    const { error } = await client.rpc("seller_submit_listing", { p_input: { id: listing.id, revision: listing.revision } });
    return error ? { ok: false as const, conflict: error.code === "40001" } : { ok: true as const };
  } catch { return { ok: false as const }; }
}

export async function saveDraft(input: unknown) {
  const parsed = z.object({ id: z.uuid(), revision: z.number().int().min(0), step: z.number().int().min(1).max(5), form: formSchema }).strict().safeParse(input);
  if (!parsed.success) return { ok: false as const, conflict: false };
  const client = await createServerSupabaseClient(); if (!client || !await getValidatedUser(client)) return { ok: false as const, conflict: false };
  try {
    const payload = savePayload(parsed.data.form);
    const { data, error } = await client.rpc("seller_save_draft", { p_input: { id: parsed.data.id, revision: parsed.data.revision, last_step: parsed.data.step, ...payload } });
    if (error) return { ok: false as const, conflict: error.code === "40001" };
    const row = z.object({ revision: z.number().int() }).parse(data);
    return { ok: true as const, revision: row.revision };
  } catch { return { ok: false as const, conflict: false }; }
}
