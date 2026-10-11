import { formatLkr } from "@/features/vehicles/money";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehiclePrice({ minor }: { minor: number }) {
  return <div><p className="text-sm text-muted-foreground">{getDictionary().vehicles.askingPrice}</p><p className="mt-1 break-words text-2xl font-semibold tabular-nums tracking-tight">{formatLkr(minor)}</p></div>;
}
