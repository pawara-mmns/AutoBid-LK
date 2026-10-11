import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type SellerListing = Database["public"]["Tables"]["seller_listings"]["Row"];
const columns = "id,owner_id,status,details,expected_price_minor,minimum_price_minor,buy_now_price_minor,revision,last_step,submitted_at,created_at,updated_at,phone_verified,submission_terms_version";
export async function loadSellerListings(client: SupabaseClient<Database>, owner: string, page = 1) {
  const { data, error } = await client.from("seller_listings").select(columns).eq("owner_id", owner).order("updated_at", { ascending: false }).order("id").range((page - 1) * 25, (page - 1) * 25 + 25);
  return error ? null : { rows: data.slice(0, 25), hasMore: data.length > 25 };
}
export async function loadSellerListing(client: SupabaseClient<Database>, owner: string, id: string) {
  const { data, error } = await client.from("seller_listings").select(columns).eq("owner_id", owner).eq("id", id).maybeSingle();
  if (error) throw new Error("seller_unavailable");
  return data;
}
