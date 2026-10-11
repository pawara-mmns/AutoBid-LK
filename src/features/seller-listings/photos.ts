import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { optimizeSellerPhoto, maxPhotoBytes } from "./image-validation";
export type SellerPhoto = Database["public"]["Tables"]["seller_listing_photos"]["Row"];
export const photoBucket = "seller-draft-photos";
export async function loadSellerCovers(client: SupabaseClient<Database>, ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await client.from("seller_listing_photos").select("listing_id,id").in("listing_id", ids).eq("is_cover", true).not("uploaded_at", "is", null).limit(25);
  if (error) return []; return data;
}
export async function loadSellerPhotos(client: SupabaseClient<Database>, listingId: string) {
  const { data, error } = await client.from("seller_listing_photos").select("id,listing_id,storage_path,slot,position,is_cover,uploaded_at,created_at").eq("listing_id", listingId).order("position").order("id").limit(12);
  if (error) throw new Error("photos_unavailable"); return data;
}
export async function readSellerPhoto(client: SupabaseClient<Database>, photo: SellerPhoto, owner: string) {
  if (photo.storage_path !== `${owner}/${photo.listing_id}/${photo.id}.jpg`) throw new Error("invalid_path");
  const { data, error } = await client.storage.from(photoBucket).download(photo.storage_path);
  if (error || !data || data.size > maxPhotoBytes) throw new Error("photo_unavailable");
  // Storage policies isolate untrusted private input; every rendered/submitted raster is decoded.
  return optimizeSellerPhoto(new Uint8Array(await data.arrayBuffer()));
}
