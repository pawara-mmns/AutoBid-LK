import Link from "next/link";
import { X } from "lucide-react";
import { filterKeys, removeVehicleFilter, type VehicleSearch, type VehicleFilterKey } from "@/features/vehicles/search-schema";
import { formatLkr } from "@/features/vehicles/money";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleActiveFilters({ filters }: { filters: VehicleSearch }) {
  const { vehicles: copy, marketplace } = getDictionary();
  const keys = filterKeys.filter((key) => filters[key] !== undefined);
  const text = (key: VehicleFilterKey) => {
    const value = filters[key];
    if ((key === "minPrice" || key === "maxPrice") && typeof value === "number") return `${copy[key]}: ${formatLkr(value)}`;
    if (key === "fuel" && filters.fuel) return `${copy.fuel}: ${copy.fuels[filters.fuel]}`;
    if (key === "transmission" && filters.transmission) return `${copy.transmission}: ${copy.transmissions[filters.transmission]}`;
    return `${key === "q" ? marketplace.searchLabel : copy[key]}: ${value}`;
  };
  if (!keys.length) return null;
  return <div aria-label={copy.activeFilters} className="mt-5 flex flex-wrap items-center gap-2">
    {keys.map((key) => <Link key={key} href={removeVehicleFilter(filters, key)} aria-label={copy.removeFilter.replace("{filter}", text(key))}
      className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-ui hover:bg-muted">
      <span className="min-w-0 break-words">{text(key)}</span><X aria-hidden="true" className="size-4 shrink-0" />
    </Link>)}
    <Link href="/vehicles" className="inline-flex min-h-11 items-center px-2 text-ui font-medium text-primary underline underline-offset-4">{copy.clear}</Link>
  </div>;
}
