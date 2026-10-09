import { z } from "zod";
import { maxPriceMinor } from "@/features/vehicles/money";
import { slugSchema } from "@/features/vehicles/search-schema";

export const cardSchema = z.object({
  id: z.uuid(), slug: slugSchema, make: z.string().min(1).max(60), model: z.string().min(1).max(80),
  manufacture_year: z.number().int().min(1900).max(2100), district: z.string().min(1).max(60),
  mileage_km: z.number().int().min(0).max(3000000).nullable(), currency: z.literal("LKR"),
  price_minor: z.number().int().min(1).max(maxPriceMinor), price_kind: z.literal("asking_price"),
  status: z.literal("approved"), approved_at: z.iso.datetime({ offset: true }), published_at: z.iso.datetime({ offset: true }),
});
export const detailSchema = cardSchema.extend({
  category: z.literal("car"), registration_year: z.number().int().nullable(),
  fuel_type: z.enum(["petrol", "diesel", "hybrid", "electric", "other"]).nullable(),
  transmission: z.enum(["automatic", "manual", "other"]).nullable(), engine_capacity_cc: z.number().int().nullable(),
  body_type: z.string().max(60).nullable(), condition_description: z.string().max(3000).nullable(),
  known_defects: z.string().max(3000).nullable(), accident_history: z.boolean().nullable(), flood_history: z.boolean().nullable(),
});
export const mediaSchema = z.object({
  id: z.uuid(), listing_id: z.uuid(), alt_text: z.string().max(160).nullable(), position: z.number().int().min(0).max(11),
  approved_at: z.iso.datetime({ offset: true }),
});
export const facetsSchema = z.object({ makes: z.array(z.string().max(60)).max(100), models: z.array(z.object({ make: z.string().max(60), model: z.string().max(80) })).max(200) });
export type VehicleCardData = z.infer<typeof cardSchema> & { photo: VehicleMedia | null };
export type VehicleDetails = z.infer<typeof detailSchema>;
export type VehicleMedia = z.infer<typeof mediaSchema>;
export type VehicleFacets = z.infer<typeof facetsSchema>;
export type VehiclePageResult = { status: "ok"; vehicles: VehicleCardData[]; count: number } | { status: "unavailable" | "error"; vehicles: []; count: 0 };
