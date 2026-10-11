import { formatLkr } from "@/features/vehicles/money";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehiclePrice({ minor, prominent = false }: { minor: number; prominent?: boolean }) {
  return <div><p className="text-sm text-muted-foreground">{getDictionary().vehicles.askingPrice}</p><p className={`mt-1 break-words font-semibold tabular-nums tracking-tight ${prominent ? "text-3xl" : "text-2xl"}`}>{formatLkr(minor)}</p></div>;
}
