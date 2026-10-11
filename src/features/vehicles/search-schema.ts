import { z } from "zod";
import { market } from "@/i18n/config";
import { rupeesToMinor, minorToRupees } from "@/features/vehicles/money";

export const districts = ["Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"] as const;
export const sortValues = ["newest", "price-asc", "price-desc", "year-desc"] as const;
export const fuelValues = ["petrol", "diesel", "hybrid", "electric", "other"] as const;
export const transmissionValues = ["automatic", "manual", "other"] as const;
export const pageSize = 12;
export const maxPage = 1000;
export const maxVehicleYear = Number(new Intl.DateTimeFormat("en", { timeZone: market.timeZone, year: "numeric" }).format(new Date())) + 1;
const empty = (value: unknown) => typeof value === "string" ? value.trim() || undefined : value;
const optionalText = (max: number) => z.preprocess(empty, z.string().max(max).regex(/^[\p{L}\p{N}\s'().,&/\-]+$/u).optional());
const money = z.preprocess(empty, z.string().max(14).transform((value, context) => {
  const minor = rupeesToMinor(value);
  if (minor === null) { context.addIssue({ code: "custom", message: "Invalid amount" }); return z.NEVER; }
  return minor;
}).optional());
const year = z.preprocess(empty, z.string().regex(/^\d{4}$/).transform(Number).pipe(z.number().int().min(1900).max(maxVehicleYear)).optional());
const mileage = z.preprocess(empty, z.string().regex(/^\d{1,7}$/).transform(Number).pipe(z.number().int().min(0).max(3000000)).optional());

export const vehicleSearchSchema = z.object({
  q: optionalText(80), make: optionalText(60), model: optionalText(80),
  category: z.preprocess(empty, z.literal("car").default("car")),
  district: z.preprocess(empty, z.enum(districts).optional()),
  minPrice: money, maxPrice: money, minYear: year, maxYear: year,
  fuel: z.preprocess(empty, z.enum(fuelValues).optional()),
  transmission: z.preprocess(empty, z.enum(transmissionValues).optional()),
  minMileage: mileage, maxMileage: mileage,
  sort: z.preprocess(empty, z.enum(sortValues).default("newest")),
  page: z.preprocess(empty, z.string().regex(/^\d{1,4}$/).transform(Number).pipe(z.number().int().min(1).max(maxPage)).default(1)),
}).refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, { path: ["maxPrice"] })
  .refine((value) => value.minYear === undefined || value.maxYear === undefined || value.minYear <= value.maxYear, { path: ["maxYear"] })
  .refine((value) => value.minMileage === undefined || value.maxMileage === undefined || value.minMileage <= value.maxMileage, { path: ["maxMileage"] });

export type VehicleSearch = z.infer<typeof vehicleSearchSchema>;
export type SearchParams = Record<string, string | string[] | undefined>;
export const defaultSearch = vehicleSearchSchema.parse({});
export const slugSchema = z.string().min(3).max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export function parseVehicleSearch(input: SearchParams) {
  const result = vehicleSearchSchema.safeParse(input);
  return result.success ? { valid: true as const, filters: result.data } : { valid: false as const, filters: defaultSearch };
}

export const filterKeys = ["q", "make", "model", "district", "minPrice", "maxPrice", "minYear", "maxYear", "fuel", "transmission", "minMileage", "maxMileage"] as const;
export type VehicleFilterKey = typeof filterKeys[number];
export function searchEntries(filters: VehicleSearch): [VehicleFilterKey | "sort" | "page", string][] {
  const entries: [VehicleFilterKey | "sort" | "page", string][] = [];
  for (const key of [...filterKeys, "sort", "page"] as const) {
    const value = filters[key];
    if (value === undefined || (key === "sort" && value === "newest") || (key === "page" && value === 1)) continue;
    entries.push([key, key === "minPrice" || key === "maxPrice" ? minorToRupees(value as number) : String(value)]);
  }
  return entries;
}

export function vehiclesUrl(filters: VehicleSearch, overrides: Partial<VehicleSearch> = {}) {
  const query = new URLSearchParams(searchEntries({ ...filters, ...overrides })).toString();
  return `/vehicles${query ? `?${query}` : ""}`;
}

export function escapeLike(value: string) { return value.replace(/[\\%_]/g, "\\$&"); }

export function removeVehicleFilter(filters: VehicleSearch, key: VehicleFilterKey) {
  // A model chosen for a brand must not linger after that brand is removed.
  return vehiclesUrl(filters, { [key]: undefined, ...(key === "make" ? { model: undefined } : {}), page: 1 });
}
