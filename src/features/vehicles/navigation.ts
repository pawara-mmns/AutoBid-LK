import { filterKeys, parseVehicleSearch, vehiclesUrl, type SearchParams } from "@/features/vehicles/search-schema";

export function vehiclesReturnUrl(input: unknown) {
  if (typeof input !== "string" || input.length > 2048 || !input.startsWith("/vehicles")) return "/vehicles";
  try {
    const url = new URL(input, "https://autobid.invalid");
    if (url.origin !== "https://autobid.invalid" || url.pathname !== "/vehicles" || url.hash) return "/vehicles";
    const params: SearchParams = {};
    // Preserve duplicates so the existing schema rejects ambiguous filter values.
    for (const key of [...filterKeys, "category", "sort", "page"]) {
      const values = url.searchParams.getAll(key);
      if (!values.length) continue;
      params[key] = values.length === 1 ? values[0] : values;
    }
    const result = parseVehicleSearch(params);
    return result.valid ? vehiclesUrl(result.filters) : "/vehicles";
  } catch { return "/vehicles"; }
}
