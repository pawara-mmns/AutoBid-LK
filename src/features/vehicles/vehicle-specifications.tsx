import type { VehicleDetails } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleSpecifications({ vehicle }: { vehicle: VehicleDetails }) {
  const { vehicles: copy, marketplace } = getDictionary();
  const values = [
    [copy.make, vehicle.make], [copy.model, vehicle.model], [copy.manufactureYear, vehicle.manufacture_year],
    [copy.registrationYear, vehicle.registration_year], [copy.district, vehicle.district], [copy.type, marketplace.cars],
    [copy.fuel, vehicle.fuel_type ? copy.fuels[vehicle.fuel_type] : null], [copy.transmission, vehicle.transmission ? copy.transmissions[vehicle.transmission] : null],
    [copy.mileage, vehicle.mileage_km === null ? null : copy.kilometres.replace("{count}", new Intl.NumberFormat("en-LK").format(vehicle.mileage_km))],
    [copy.engine, vehicle.engine_capacity_cc === null ? null : copy.engineUnit.replace("{count}", String(vehicle.engine_capacity_cc))], [copy.body, vehicle.body_type],
  ];
  return <section><h2 className="text-2xl font-semibold tracking-tight">{copy.specifications}</h2><dl className="mt-5 grid gap-x-8 sm:grid-cols-2">{values.map(([label, value]) => <div key={String(label)} className="flex justify-between gap-4 border-b border-border py-3 text-sm">
    <dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-end font-medium">{value ?? copy.notStated}</dd>
  </div>)}</dl></section>;
}
