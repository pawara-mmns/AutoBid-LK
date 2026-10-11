import { VehicleCard } from "@/features/vehicles/vehicle-card";
import type { VehicleCardData } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleGrid({ vehicles, photoSizes, returnTo }: { vehicles: VehicleCardData[]; photoSizes?: string; returnTo?: string }) {
  return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} photoSizes={photoSizes} returnTo={returnTo} />)}</div>;
}

export function VehicleSkeletons({ count = 6 }: { count?: number }) {
  return <div role="status"><span className="sr-only">{getDictionary().vehicles.loading}</span>
    <div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: count }, (_, index) => <div key={index} className="overflow-hidden rounded-md border border-border bg-surface">
      <div className="aspect-[4/3] bg-muted" /><div className="space-y-4 p-5"><div className="h-5 w-3/4 rounded bg-muted" /><div className="h-4 w-1/2 rounded bg-muted" /><div className="h-4 w-1/3 rounded bg-muted" /><div className="h-8 rounded bg-muted" /><div className="h-4 w-3/4 rounded bg-muted" /><div className="h-11 border-t border-border" /></div>
    </div>)}</div>
  </div>;
}
