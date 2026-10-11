import { Suspense } from "react";
import { VehicleGrid, VehicleSkeletons } from "@/features/vehicles/vehicle-grid";
import { ListingState } from "@/features/vehicles/listing-state";
import { queryVehicles } from "@/features/vehicles/queries";
import { defaultSearch } from "@/features/vehicles/search-schema";
import { getDictionary } from "@/i18n/get-dictionary";

async function RecentVehicleResults() {
  const result = await queryVehicles(defaultSearch, undefined, 6);
  if (result.status !== "ok") return <ListingState kind="error" />;
  return result.vehicles.length ? <VehicleGrid vehicles={result.vehicles} /> : <ListingState kind="empty" />;
}

export function RecentVehicles() {
  const copy = getDictionary().marketplace;
  return <section className="site-container py-6" aria-labelledby="recent-vehicles-title">
    <div className="mb-4"><h2 id="recent-vehicles-title" className="text-section font-semibold">{copy.recentTitle}</h2><p className="mt-2 max-w-xl text-ui text-muted-foreground">{copy.recentDescription}</p></div>
    <Suspense fallback={<VehicleSkeletons />}><RecentVehicleResults /></Suspense>
  </section>;
}
