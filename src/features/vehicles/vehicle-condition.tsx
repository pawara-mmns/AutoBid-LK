import type { VehicleDetails } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleCondition({ vehicle }: { vehicle: VehicleDetails }) {
  const copy = getDictionary().vehicles;
  const history = (value: boolean | null) => value === null ? copy.notStated : value ? copy.historyYes : copy.historyNo;
  return <section aria-labelledby="vehicle-condition">
    <h2 id="vehicle-condition" className="text-section font-semibold">{copy.condition}</h2>
    <p className="mt-3 text-ui text-muted-foreground">{copy.conditionSource}</p>
    <div className={`mt-5 border-s-2 ps-4 ${vehicle.known_defects ? "border-danger" : "border-border"}`}>
      <h3 className="font-semibold">{copy.defects}</h3><p className="mt-2 whitespace-pre-line break-words">{vehicle.known_defects || copy.notStated}</p>
    </div>
    <dl className="mt-6 grid gap-5 sm:grid-cols-2">
      <div><dt className="text-ui text-muted-foreground">{copy.accidentHistory}</dt><dd className="mt-1 font-medium">{history(vehicle.accident_history)}</dd></div>
      <div><dt className="text-ui text-muted-foreground">{copy.floodHistory}</dt><dd className="mt-1 font-medium">{history(vehicle.flood_history)}</dd></div>
    </dl>
  </section>;
}
