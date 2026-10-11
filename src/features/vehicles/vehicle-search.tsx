import { Button } from "@/components/ui/button";
import { VehicleSearchInput } from "@/features/vehicles/vehicle-search-input";
import { searchEntries, type VehicleSearch } from "@/features/vehicles/search-schema";
import { getDictionary } from "@/i18n/get-dictionary";

export function SearchFields({ filters, omit }: { filters: VehicleSearch; omit: string[] }) {
  return <>{searchEntries(filters).filter(([key]) => !omit.includes(key)).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}</>;
}

export function VehicleSearch({ filters, hero = false }: { filters: VehicleSearch; hero?: boolean }) {
  const copy = getDictionary().marketplace;
  const id = hero ? "hero-search" : "vehicle-search";
  return <form action="/vehicles" method="get" role="search" className="w-full">
    <label htmlFor={id} className="mb-2 block text-sm font-medium">{copy.searchLabel}</label>
    <div className="flex flex-col gap-3 sm:flex-row">
      <VehicleSearchInput key={filters.q ?? ""} id={id} initialValue={filters.q ?? ""} placeholder={copy.searchPlaceholder} />
      <SearchFields filters={filters} omit={["q", "page"]} />
      <Button type="submit" className="shrink-0">{hero ? copy.find : getDictionary().vehicles.search}</Button>
    </div>
  </form>;
}
