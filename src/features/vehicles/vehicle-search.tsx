import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchEntries, type VehicleSearch } from "@/features/vehicles/search-schema";
import { getDictionary } from "@/i18n/get-dictionary";

export function SearchFields({ filters, omit }: { filters: VehicleSearch; omit: string[] }) {
  return <>{searchEntries(filters).filter(([key]) => !omit.includes(key)).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}</>;
}

export function VehicleSearch({ filters, hero = false }: { filters: VehicleSearch; hero?: boolean }) {
  const copy = getDictionary().marketplace;
  const id = hero ? "hero-search" : "vehicle-search";
  return <form action="/vehicles" method="get" role="search" className="w-full">
    <label htmlFor={id} className="mb-2 block text-sm font-semibold">{copy.searchLabel}</label>
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input id={id} name="q" type="search" defaultValue={filters.q ?? ""} maxLength={80} placeholder={copy.searchPlaceholder} className="min-w-0 flex-1 bg-background" />
      <SearchFields filters={filters} omit={["q", "page"]} />
      <Button type="submit" className="shrink-0"><Search aria-hidden="true" />{hero ? copy.find : getDictionary().vehicles.search}</Button>
    </div>
  </form>;
}
