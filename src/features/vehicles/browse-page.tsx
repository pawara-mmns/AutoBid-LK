import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VehicleSearch, SearchFields } from "@/features/vehicles/vehicle-search";
import { VehicleFilters } from "@/features/vehicles/vehicle-filters";
import { VehicleGrid } from "@/features/vehicles/vehicle-grid";
import { ListingState } from "@/features/vehicles/listing-state";
import { queryVehicles, queryVehicleFacets } from "@/features/vehicles/queries";
import { parseVehicleSearch, pageSize, maxPage, searchEntries, vehiclesUrl, sortValues, type SearchParams } from "@/features/vehicles/search-schema";
import { getDictionary } from "@/i18n/get-dictionary";

export async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const { valid, filters } = parseVehicleSearch(searchParams);
  const [result, facets] = await Promise.all([valid ? queryVehicles(filters) : Promise.resolve(null), queryVehicleFacets()]);
  const copy = getDictionary().vehicles;
  const active = searchEntries(filters).filter(([key]) => !["sort", "page"].includes(key));
  const pages = result?.status === "ok" ? Math.max(1, Math.min(maxPage, Math.ceil(result.count / pageSize))) : 1;
  return <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1><p className="mt-3 text-muted-foreground">{copy.description}</p>
    <div className="mt-7 max-w-3xl"><VehicleSearch filters={filters} /></div>
    {!valid && <p role="alert" className="mt-6 rounded-md border border-border bg-muted p-4">{copy.invalidFilters} <Link href="/vehicles" className="font-semibold text-primary underline">{copy.clear}</Link></p>}
    {active.length > 0 && <div className="mt-5 flex flex-wrap items-center gap-2" aria-label={copy.activeFilters}>
      <span className="text-sm text-muted-foreground">{active.length === 1 ? copy.filterCountOne : copy.filterCount.replace("{count}", String(active.length))}</span>
      {active.map(([key, value]) => <span key={key} className="max-w-full break-words rounded-full border border-border bg-muted px-3 py-1.5 text-sm">{key === "q" ? getDictionary().marketplace.searchLabel : copy[key as "make" | "model" | "district" | "minPrice" | "maxPrice" | "minYear" | "maxYear"]}: {value}</span>)}
      <Link href="/vehicles" className="inline-flex min-h-11 items-center px-2 text-sm text-primary underline">{copy.clear}</Link>
    </div>}
    <div className="mt-7 grid gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
      <VehicleFilters filters={filters} facets={facets} />
      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <p className="text-sm font-semibold" role="status">{result?.status === "ok" ? result.count === 1 ? copy.countOne : copy.count.replace("{count}", new Intl.NumberFormat("en-LK").format(result.count)) : ""}</p>
          <form action="/vehicles" method="get" className="flex flex-wrap items-end gap-2">
            <SearchFields filters={filters} omit={["sort", "page"]} />
            <div><label htmlFor="vehicle-sort" className="mb-1 block text-sm">{copy.sort}</label>
              <select id="vehicle-sort" name="sort" defaultValue={filters.sort} className="min-h-11 max-w-full rounded-md border border-border bg-background px-3 text-sm">{sortValues.map((sort) => <option key={sort} value={sort}>{copy.sorts[sort]}</option>)}</select>
            </div><Button type="submit" variant="outline">{copy.sortApply}</Button>
          </form>
        </div>
        {!result || result.status !== "ok" ? <ListingState kind="error" /> : result.vehicles.length ? <VehicleGrid vehicles={result.vehicles} /> : <ListingState kind="empty" filtered={active.length > 0 || filters.page > 1} />}
        {result?.status === "ok" && result.count > 0 && <nav aria-label={copy.pagination} className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {filters.page > pages ? <Button asChild variant="outline"><Link href={vehiclesUrl(filters, { page: 1 })}>{copy.first}</Link></Button> : filters.page > 1 ? <Button asChild variant="outline"><Link href={vehiclesUrl(filters, { page: filters.page - 1 })}>{copy.previous}</Link></Button> : <span />}
          {filters.page <= pages && <span className="text-sm text-muted-foreground">{copy.page.replace("{page}", String(filters.page)).replace("{pages}", String(pages))}</span>}
          {filters.page < pages && <Button asChild variant="outline"><Link href={vehiclesUrl(filters, { page: filters.page + 1 })}>{copy.next}</Link></Button>}
          {filters.page === maxPage && result.count > pageSize * maxPage && <p className="w-full text-sm text-muted-foreground">{copy.pageLimit}</p>}
        </nav>}
      </div>
    </div>
  </div>;
}
