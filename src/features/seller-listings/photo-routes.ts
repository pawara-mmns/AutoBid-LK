import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getValidatedUser } from "@/features/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { loadSellerListing } from "./queries";
import { loadSellerPhotos, photoBucket, readSellerPhoto } from "./photos";
import { maxPhotoBytes, optimizeSellerPhoto } from "./image-validation";
import { readBoundedBody } from "./request-body";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
const result = (data: unknown, status = 200) => Response.json(data, { status, headers });
async function boundedForm(request: Request) {
  const body = await readBoundedBody(request, maxPhotoBytes + 16384);
  return new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("content-type") ?? "" }, body }).formData();
}
export async function handlePhotoMutation(request: Request, id: string) {
  if (request.headers.get("origin") !== new URL(publicEnv.NEXT_PUBLIC_SITE_URL).origin) return result({ error: "not_allowed" }, 403);
  if (!z.uuid().safeParse(id).success) return result({ error: "not_available" }, 404);
  const client = await createServerSupabaseClient(); const user = client && await getValidatedUser(client); if (!client || !user) return result({ error: "sign_in" }, 401);
  try {
    const listing = await loadSellerListing(client, user.id, id); if (!listing || !(listing.status === "draft" || (listing.status === "changes_required" && Array.isArray(listing.correction_scopes) && listing.correction_scopes.includes("photos")))) return result({ error: "not_editable" }, 403);
    if (request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      const form = await boundedForm(request); const file = form.get("file"); const slot = z.enum(["front", "back", "interior", "dashboard", "extra"]).parse(form.get("slot"));
      if (!(file instanceof File) || file.size > maxPhotoBytes) return result({ error: "unsupported" }, 400);
      const photos = await loadSellerPhotos(client, id); if (photos.length >= 12) return result({ error: "limit" }, 400);
      const photoId = randomUUID();
      const { error: reservation } = await client.rpc("seller_manage_photo", { p_input: { listing_id: id, photo_id: photoId, action: "reserve", slot } });
      if (reservation) return result({ error: "upload_failed" }, 400);
      const path = `${user.id}/${id}/${photoId}.jpg`;
      let image: Buffer;
      try { image = await optimizeSellerPhoto(new Uint8Array(await file.arrayBuffer())); }
      catch { await client.rpc("seller_manage_photo", { p_input: { listing_id: id, photo_id: photoId, action: "remove" } }); return result({ error: "unsupported" }, 400); }
      const { error: upload } = await client.storage.from(photoBucket).upload(path, image, { contentType: "image/jpeg", upsert: false, cacheControl: "0" });
      if (upload) { await client.rpc("seller_manage_photo", { p_input: { listing_id: id, photo_id: photoId, action: "remove" } }); return result({ error: "upload_failed" }, 400); }
      const { error: complete } = await client.rpc("seller_manage_photo", { p_input: { listing_id: id, photo_id: photoId, action: "complete" } });
      if (complete) {
        await client.storage.from(photoBucket).remove([path]);
        await client.rpc("seller_manage_photo", { p_input: { listing_id: id, photo_id: photoId, action: "remove" } });
        return result({ error: "upload_failed" }, 400);
      }
    } else {
      const body = z.object({ photoId: z.uuid(), action: z.enum(["remove", "cover", "earlier", "later"]) }).strict().parse(JSON.parse((await readBoundedBody(request, 2048)).toString("utf8")));
      const photo = (await loadSellerPhotos(client, id)).find((p) => p.id === body.photoId); if (!photo) return result({ error: "not_available" }, 404);
      if (body.action === "remove") { const { error } = await client.storage.from(photoBucket).remove([photo.storage_path]); if (error) return result({ error: "remove_failed" }, 400); }
      const { error } = await client.rpc("seller_manage_photo", { p_input: { listing_id: id, photo_id: photo.id, action: body.action } }); if (error) return result({ error: "change_failed" }, 400);
    }
    return result({ photos: await loadSellerPhotos(client, id) });
  } catch (error) {
    const invalid = error instanceof z.ZodError || error instanceof SyntaxError || (error instanceof Error && ["size_limit", "missing_body"].includes(error.message));
    return result({ error: invalid ? "unsupported" : "upload_failed" }, invalid ? 400 : 503);
  }
}
export async function handlePhotoPreview(id: string, photoId: string) {
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(photoId).success) return result({ error: "not_available" }, 404);
  const client = await createServerSupabaseClient(); const user = client && await getValidatedUser(client); if (!client || !user) return result({ error: "not_available" }, 404);
  try {
    if (!await loadSellerListing(client, user.id, id)) return result({ error: "not_available" }, 404);
    const photo = (await loadSellerPhotos(client, id)).find((p) => p.id === photoId && p.uploaded_at); if (!photo) return result({ error: "not_available" }, 404);
    const image = await readSellerPhoto(client, photo, user.id);
    return new Response(new Uint8Array(image), { headers: { ...headers, "Content-Type": "image/jpeg", "Content-Disposition": "inline" } });
  } catch { return result({ error: "not_available" }, 404); }
}
