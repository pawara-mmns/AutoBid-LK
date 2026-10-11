import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalDrawer } from "@/components/ui/modal-drawer";
import { districts, maxVehicleYear, searchEntries, type VehicleSearch } from "@/features/vehicles/search-schema";
import type { VehicleFacets } from "@/features/vehicles/types";
import { minorToRupees } from "@/features/vehicles/money";
import { getDictionary } from "@/i18n/get-dictionary";

const selectClass = "min-h-12 w-full min-w-0 rounded-md border border-control-border bg-surface px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function FilterForm({ filters, facets, prefix }: { filters: VehicleSearch; facets: VehicleFacets; prefix: string }) {
  const { vehicles: copy, marketplace } = getDictionary();
  const makes = [...new Set([...facets.makes, ...(filters.make ? [filters.make] : [])])].sort();
  const models = facets.models.filter((pair) => !filters.make || pair.make === filters.make);
  return <form action="/vehicles" method="get" className="space-y-5">
    {filters.q && <input type="hidden" name="q" value={filters.q} />}<input type="hidden" name="sort" value={filters.sort} />
    <input type="hidden" name="category" value="car" />
    <p className="border-b border-border pb-4 text-sm text-muted-foreground">{marketplace.usedCars}</p>
    <div><label htmlFor={`${prefix}-make`} className="mb-2 block text-sm font-semibold">{copy.make}</label>
      <select id={`${prefix}-make`} name="make" defaultValue={filters.make ?? ""} className={selectClass}><option value="">{copy.anyBrand}</option>{makes.map((make) => <option key={make}>{make}</option>)}</select>
    </div>
    <div><label htmlFor={`${prefix}-district`} className="mb-2 block text-sm font-semibold">{copy.district}</label>
      <select id={`${prefix}-district`} name="district" defaultValue={filters.district ?? ""} className={selectClass}><option value="">{copy.anyDistrict}</option>{districts.map((district) => <option key={district}>{district}</option>)}</select>
    </div>
    <div className="grid gap-4">
      {(["minPrice", "maxPrice"] as const).map((key) => <div key={key}><label htmlFor={`${prefix}-${key}`} className="mb-2 block text-sm font-semibold">{copy[key]}</label>
        <Input id={`${prefix}-${key}`} name={key} inputMode="decimal" maxLength={14} placeholder={copy.pricePlaceholder} defaultValue={filters[key] === undefined ? "" : minorToRupees(filters[key])} />
      </div>)}
    </div>
    <details className="rounded-md border border-border p-3" open={!!filters.model || filters.minYear !== undefined || filters.maxYear !== undefined}>
      <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">{copy.moreFilters}</summary>
      <div className="mt-3 space-y-4">
        <div><label htmlFor={`${prefix}-model`} className="mb-2 block text-sm font-semibold">{copy.model}</label>
          <Input id={`${prefix}-model`} name="model" defaultValue={filters.model ?? ""} maxLength={80} list={`${prefix}-models`} placeholder={copy.modelPlaceholder} />
          <datalist id={`${prefix}-models`}>{models.map((pair) => <option key={`${pair.make}-${pair.model}`} value={pair.model} />)}</datalist>
        </div>
        <div className="grid grid-cols-2 gap-3">{(["minYear", "maxYear"] as const).map((key) => <div key={key}>
          <label htmlFor={`${prefix}-${key}`} className="mb-2 block text-sm font-semibold">{copy[key]}</label>
          <Input id={`${prefix}-${key}`} name={key} type="number" min={1900} max={maxVehicleYear} inputMode="numeric" defaultValue={filters[key] ?? ""} />
        </div>)}</div>
      </div>
    </details>
    <Button type="submit" className="w-full">{copy.apply}</Button>
    <Link href="/vehicles" className="flex min-h-11 items-center justify-center rounded-sm text-sm font-semibold text-primary underline underline-offset-4">{copy.clear}</Link>
  </form>;
}

export function VehicleFilters({ filters, facets, display }: { filters: VehicleSearch; facets: VehicleFacets; display: "mobile" | "desktop" }) {
  const copy = getDictionary();
  const count = searchEntries(filters).filter(([key]) => !["sort", "page"].includes(key)).length;
  return <>
    {display === "mobile" && <div className="lg:hidden"><ModalDrawer title={copy.vehicles.filters} closeLabel={copy.common.close} trigger={<><SlidersHorizontal aria-hidden="true" /><span>{copy.vehicles.filters}{count ? ` (${count})` : ""}</span></>}>
      <FilterForm filters={filters} facets={facets} prefix="mobile" />
    </ModalDrawer></div>}
    {display === "desktop" && <aside aria-label={copy.vehicles.filters} className="hidden self-start border-e border-border pe-6 lg:block">
      <h2 className="mb-5 text-lg font-semibold">{copy.vehicles.filters}</h2>
      <FilterForm filters={filters} facets={facets} prefix="desktop" />
    </aside>}
  </>;
}
