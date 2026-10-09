import { formatLkr } from "@/features/vehicles/money";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehiclePrice({ minor }: { minor: number }) {
  return <div><p className="text-xs text-muted-foreground">{getDictionary().vehicles.askingPrice}</p><p className="mt-1 text-xl font-semibold tracking-tight">{formatLkr(minor)}</p></div>;
}
