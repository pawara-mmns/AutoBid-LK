import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VehicleSearch } from "@/features/vehicles/vehicle-search";
import { VehicleSort } from "@/features/vehicles/vehicle-sort";
import { VehicleActiveFilters } from "@/features/vehicles/vehicle-active-filters";
import { VehicleFilters } from "@/features/vehicles/vehicle-filters";
import { VehicleGrid } from "@/features/vehicles/vehicle-grid";
import { ListingState } from "@/features/vehicles/listing-state";
import { queryVehicles, queryVehicleFacets } from "@/features/vehicles/queries";
import { parseVehicleSearch, pageSize, maxPage, filterKeys, vehiclesUrl, type SearchParams } from "@/features/vehicles/search-schema";
import { getDictionary } from "@/i18n/get-dictionary";

export async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const { valid, filters } = parseVehicleSearch(searchParams);
  const [result, facets] = await Promise.all([queryVehicles(filters), queryVehicleFacets()]);
  const copy = getDictionary().vehicles;
  const active = filterKeys.filter((key) => filters[key] !== undefined);
  const pages = result?.status === "ok" ? Math.max(1, Math.min(maxPage, Math.ceil(result.count / pageSize))) : 1;
  return <div className="site-container py-8 sm:py-10">
    <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1><p className="mt-2 text-muted-foreground">{copy.description}</p>
    <div className="mt-5 max-w-3xl"><VehicleSearch filters={filters} /></div>
    {!valid && <p role="alert" className="mt-6 rounded-md border border-border bg-muted p-4">{copy.invalidFilters} <Link href="/vehicles" className="font-semibold text-primary underline">{copy.clear}</Link></p>}
    <div className="mt-3 lg:hidden"><VehicleFilters filters={filters} facets={facets} display="mobile" /></div>
    <VehicleActiveFilters filters={filters} />
    <div className="mt-6 grid gap-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8">
      <VehicleFilters filters={filters} facets={facets} display="desktop" />
      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <p className="text-sm font-semibold" role="status">{result?.status === "ok" ? result.count === 1 ? copy.countOne : copy.count.replace("{count}", new Intl.NumberFormat("en-LK").format(result.count)) : ""}</p>
          <VehicleSort filters={filters} />
        </div>
        {result.status !== "ok" ? <ListingState kind="error" /> : result.vehicles.length ? <VehicleGrid vehicles={result.vehicles} returnTo={vehiclesUrl(filters)} photoSizes="(min-width: 1280px) 300px, (min-width: 1024px) calc((100vw - 396px) / 2), (min-width: 640px) calc((100vw - 84px) / 2), calc(100vw - 40px)" /> : <ListingState kind="empty" filtered={active.length > 0 || filters.page > 1} />}
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
