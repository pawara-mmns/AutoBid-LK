import { Button } from "@/components/ui/button";
import { SearchFields } from "@/features/vehicles/vehicle-search";
import { sortValues, type VehicleSearch } from "@/features/vehicles/search-schema";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleSort({ filters }: { filters: VehicleSearch }) {
  const copy = getDictionary().vehicles;
  return <form action="/vehicles" method="get" className="flex w-full items-end gap-2 sm:w-auto">
    <SearchFields filters={filters} omit={["sort", "page"]} />
    <div className="min-w-0 flex-1"><label htmlFor="vehicle-sort" className="mb-2 block text-ui">{copy.sort}</label>
      <select key={filters.sort} id="vehicle-sort" name="sort" defaultValue={filters.sort} className="min-h-12 w-full rounded-md border border-control-border bg-surface px-3 py-2 text-ui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        {sortValues.map((sort) => <option key={sort} value={sort}>{copy.sorts[sort]}</option>)}
      </select>
    </div><Button type="submit" variant="outline" className="shrink-0 px-3">{copy.sortApply}</Button>
  </form>;
}
