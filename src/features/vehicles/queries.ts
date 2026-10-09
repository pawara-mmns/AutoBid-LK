import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { defaultSearch, escapeLike, pageSize, slugSchema, type VehicleSearch } from "@/features/vehicles/search-schema";
import { cardSchema, detailSchema, mediaSchema, facetsSchema, type VehiclePageResult, type VehicleFacets, type VehicleDetails, type VehicleMedia } from "@/features/vehicles/types";
import type { Database } from "@/types/database";

type PublicClient = SupabaseClient<Database>;
type ClientFactory = () => PublicClient | null;
const cardColumns = "id,slug,make,model,manufacture_year,district,mileage_km,currency,price_minor,price_kind,status,approved_at,published_at" as const;
const detailColumns = `${cardColumns},category,registration_year,fuel_type,transmission,engine_capacity_cc,body_type,condition_description,known_defects,accident_history,flood_history` as const;
const photoColumns = "id,listing_id,alt_text,position,approved_at" as const;
const emptyFacets: VehicleFacets = { makes: [], models: [] };

export async function queryVehicles(filters: VehicleSearch = defaultSearch, createClient: ClientFactory = createPublicSupabaseClient, limit = pageSize): Promise<VehiclePageResult> {
  const client = createClient();
  if (!client) return { status: "unavailable", vehicles: [], count: 0 };
  const boundedLimit = Math.min(pageSize, Math.max(1, Math.trunc(limit)));
  try {
    let query = client.from("vehicle_listings").select(cardColumns, { count: "exact" })
      .eq("status", "approved").not("approved_at", "is", null).lte("published_at", new Date().toISOString()).eq("category", "car");
    if (filters.q) query = query.ilike("search_text", `%${escapeLike(filters.q)}%`);
    if (filters.make) query = query.ilike("make", escapeLike(filters.make));
    if (filters.model) query = query.ilike("model", `%${escapeLike(filters.model)}%`);
    if (filters.district) query = query.eq("district", filters.district);
    if (filters.minPrice !== undefined) query = query.gte("price_minor", filters.minPrice);
    if (filters.maxPrice !== undefined) query = query.lte("price_minor", filters.maxPrice);
    if (filters.minYear !== undefined) query = query.gte("manufacture_year", filters.minYear);
    if (filters.maxYear !== undefined) query = query.lte("manufacture_year", filters.maxYear);
    const order = { newest: ["published_at", false], "price-asc": ["price_minor", true], "price-desc": ["price_minor", false], "year-desc": ["manufacture_year", false] } as const;
    const [column, ascending] = order[filters.sort];
    const offset = (filters.page - 1) * boundedLimit;
    const { data, error, count } = await query.order(column, { ascending }).order("id", { ascending: true }).range(offset, offset + boundedLimit - 1);
    if (error || !data || count === null || !Number.isSafeInteger(count) || count < 0) return { status: "error", vehicles: [], count: 0 };
    const listings = cardSchema.array().max(boundedLimit).parse(data);
    if (!listings.length) return { status: "ok", vehicles: [], count };
    const media = await client.from("vehicle_media").select(photoColumns).in("listing_id", listings.map((vehicle) => vehicle.id))
      .not("approved_at", "is", null).order("position").order("id").limit(listings.length * 12);
    if (media.error) return { status: "error", vehicles: [], count: 0 };
    const photos = mediaSchema.array().max(listings.length * 12).parse(media.data);
    return { status: "ok", count, vehicles: listings.map((vehicle) => ({ ...vehicle, photo: photos.find((photo) => photo.listing_id === vehicle.id) ?? null })) };
  } catch { return { status: "error", vehicles: [], count: 0 }; }
}

export async function queryVehicleFacets(createClient: ClientFactory = createPublicSupabaseClient): Promise<VehicleFacets> {
  const client = createClient();
  if (!client) return emptyFacets;
  try {
    const { data, error } = await client.rpc("marketplace_facets");
    if (error) return emptyFacets;
    return facetsSchema.parse(data);
  } catch { return emptyFacets; }
}

type DetailResult = { status: "ok"; vehicle: VehicleDetails; media: VehicleMedia[] } | { status: "not-found" | "unavailable" | "error" };
export async function queryVehicleDetails(slug: string, createClient: ClientFactory = createPublicSupabaseClient): Promise<DetailResult> {
  if (!slugSchema.safeParse(slug).success) return { status: "not-found" };
  const client = createClient();
  if (!client) return { status: "unavailable" };
  try {
    const { data, error } = await client.from("vehicle_listings").select(detailColumns).eq("slug", slug)
      .eq("status", "approved").not("approved_at", "is", null).lte("published_at", new Date().toISOString()).maybeSingle();
    if (error) return { status: "error" };
    if (!data) return { status: "not-found" };
    const vehicle = detailSchema.parse(data);
    const photos = await client.from("vehicle_media").select(photoColumns).eq("listing_id", vehicle.id).not("approved_at", "is", null).order("position").order("id").limit(12);
    if (photos.error) return { status: "error" };
    return { status: "ok", vehicle, media: mediaSchema.array().max(12).parse(photos.data) };
  } catch { return { status: "error" }; }
}

export const getVehicleDetails = cache(queryVehicleDetails);

export async function queryRelatedVehicles(vehicle: VehicleDetails, createClient: ClientFactory = createPublicSupabaseClient): Promise<VehiclePageResult> {
  // Reuse bounded public filtering; exclude the current listing from the small result.
  const result = await queryVehicles({ ...defaultSearch, make: vehicle.make }, createClient, 5);
  return result.status === "ok" ? { ...result, vehicles: result.vehicles.filter((row) => row.id !== vehicle.id).slice(0, 4) } : result;
}

export async function queryVehiclePhoto(listingId: string, photoId: string, createClient: ClientFactory = createPublicSupabaseClient) {
  const client = createClient();
  if (!client) return null;
  try {
    const listing = await client.from("vehicle_listings").select("id").eq("id", listingId).eq("status", "approved")
      .not("approved_at", "is", null).lte("published_at", new Date().toISOString()).maybeSingle();
    if (listing.error || !listing.data) return null;
    const media = await client.from("vehicle_media").select("storage_path").eq("id", photoId).eq("listing_id", listingId).not("approved_at", "is", null).maybeSingle();
    if (media.error || !media.data || !new RegExp(`^${listingId}/[a-z0-9-]+\\.(jpg|jpeg|png|webp)$`).test(media.data.storage_path)) return null;
    const { data, error } = await client.storage.from("vehicle-photos").download(media.data.storage_path);
    return !error && data && ["image/jpeg", "image/png", "image/webp"].includes(data.type) && data.size <= 10485760 ? data : null;
  } catch { return null; }
}
