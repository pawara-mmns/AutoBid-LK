import type { VehicleDetails } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleSpecifications({ vehicle }: { vehicle: VehicleDetails }) {
  const { vehicles: copy, marketplace } = getDictionary();
  const values = [
    [copy.manufactureYear, vehicle.manufacture_year], [copy.registrationYear, vehicle.registration_year],
    [copy.mileage, vehicle.mileage_km === null ? null : copy.kilometres.replace("{count}", new Intl.NumberFormat("en-LK").format(vehicle.mileage_km))],
    [copy.fuel, vehicle.fuel_type ? copy.fuels[vehicle.fuel_type] : null], [copy.transmission, vehicle.transmission ? copy.transmissions[vehicle.transmission] : null],
    [copy.engine, vehicle.engine_capacity_cc === null ? null : copy.engineUnit.replace("{count}", String(vehicle.engine_capacity_cc))], [copy.body, vehicle.body_type],
    [copy.type, marketplace.usedCars], [copy.district, vehicle.district],
  ];
  return <section aria-labelledby="vehicle-specifications"><h2 id="vehicle-specifications" className="text-section font-semibold">{copy.specifications}</h2><dl className="mt-3 grid gap-x-6 sm:grid-cols-2">{values.map(([label, value]) => <div key={String(label)} className="min-w-0 border-b border-border py-3">
    <dt className="text-ui text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value === null || value === "" ? copy.notStated : value}</dd>
  </div>)}</dl></section>;
}
