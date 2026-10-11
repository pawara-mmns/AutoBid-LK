import type { VehicleDetails } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleHighlights({ vehicle }: { vehicle: VehicleDetails }) {
  const copy = getDictionary().vehicles;
  const summary = [vehicle.manufacture_year, vehicle.fuel_type ? copy.fuels[vehicle.fuel_type] : null, vehicle.transmission ? copy.transmissions[vehicle.transmission] : null].filter((value) => value !== null);
  const location = [vehicle.mileage_km === null ? null : copy.kilometres.replace("{count}", new Intl.NumberFormat("en-LK").format(vehicle.mileage_km)), vehicle.district].filter((value) => value !== null);
  return <div className="mt-3 space-y-2 text-muted-foreground">
    <p className="break-words">{summary.join(" · ")}</p><p className="break-words">{location.join(" · ")}</p>
    {vehicle.registration_year !== null && <p className="text-ui">{copy.registrationYear}: {vehicle.registration_year}</p>}
  </div>;
}
