import type { VehicleDetails } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleHighlights({ vehicle }: { vehicle: VehicleDetails }) {
  const copy = getDictionary().vehicles;
  const values = [
    [copy.mileage, vehicle.mileage_km === null ? copy.notStated : copy.kilometres.replace("{count}", new Intl.NumberFormat("en-LK").format(vehicle.mileage_km))],
    [copy.fuel, vehicle.fuel_type ? copy.fuels[vehicle.fuel_type] : copy.notStated],
    [copy.transmission, vehicle.transmission ? copy.transmissions[vehicle.transmission] : copy.notStated],
  ];
  return <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-border py-5">
    {values.map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}
  </dl>;
}
