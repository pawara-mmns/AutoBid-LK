import { VehicleGrid } from "@/features/vehicles/vehicle-grid";
import { queryRelatedVehicles } from "@/features/vehicles/queries";
import type { VehicleDetails } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export async function RelatedVehicles({ vehicle }: { vehicle: VehicleDetails }) {
  const result = await queryRelatedVehicles(vehicle);
  return result.status === "ok" && result.vehicles.length ? <section className="mt-10 border-t border-border pt-8">
    <h2 className="mb-6 text-section font-semibold">{getDictionary().vehicles.related}</h2><VehicleGrid vehicles={result.vehicles} />
  </section> : null;
}
