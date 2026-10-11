"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { districts, filterKeys, fuelValues, transmissionValues, maxVehicleYear, searchEntries, type VehicleSearch, type VehicleFilterKey } from "@/features/vehicles/search-schema";
import type { VehicleFacets } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

const selectClass = "min-h-12 w-full min-w-0 rounded-md border border-control-border bg-surface px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const emptyDraft = Object.fromEntries(filterKeys.map((key) => [key, ""])) as Record<VehicleFilterKey, string>;

export function VehicleFilterForm({ filters, facets, prefix }: { filters: VehicleSearch; facets: VehicleFacets; prefix: string }) {
  const { vehicles: copy, marketplace } = getDictionary();
  const [draft, setDraft] = useState({ ...emptyDraft, ...Object.fromEntries(searchEntries(filters)) });
  const [advancedOpen, setAdvancedOpen] = useState(!!filters.fuel || !!filters.transmission || filters.minMileage !== undefined || filters.maxMileage !== undefined);
  const update = (key: VehicleFilterKey, value: string) => setDraft((current) => ({ ...current, [key]: value, ...(key === "make" ? { model: "" } : {}) }));
  const makes = [...new Set([...facets.makes, ...(draft.make ? [draft.make] : [])])].sort();
  const models = [...new Set([...facets.models.filter((pair) => !draft.make || pair.make === draft.make).map((pair) => pair.model), ...(draft.model ? [draft.model] : [])])].sort();
  const label = (key: VehicleFilterKey | "type") => <label htmlFor={`${prefix}-${key}`} className="mb-2 block text-ui font-medium">{key === "q" ? marketplace.searchLabel : copy[key]}</label>;
  const range = (keys: readonly VehicleFilterKey[], kind: "price" | "year" | "mileage") => <div className="grid grid-cols-2 gap-3">{keys.map((key) => <div key={key}>
    {label(key)}<Input id={`${prefix}-${key}`} name={key} value={draft[key]} onChange={(event) => update(key, event.target.value)}
      type={kind === "price" ? "text" : "number"} inputMode={kind === "price" ? "decimal" : "numeric"}
      min={kind === "year" ? 1900 : 0} max={kind === "year" ? maxVehicleYear : kind === "mileage" ? 3000000 : undefined}
      maxLength={kind === "price" ? 14 : undefined} className="px-3" />
  </div>)}</div>;

  return <form action="/vehicles" method="get" className={prefix === "mobile" ? "flex min-h-0 flex-1 flex-col" : "space-y-5"}>
    {draft.q && <input type="hidden" name="q" value={draft.q} />}<input type="hidden" name="sort" value={filters.sort} />
    <div className={prefix === "mobile" ? "min-h-0 flex-1 space-y-5 overflow-y-auto py-5" : "space-y-5"}>
    <div>{label("type")}<select id={`${prefix}-type`} name="category" className={selectClass} defaultValue="car"><option value="car">{marketplace.usedCars}</option></select></div>
    <div>{label("make")}<select id={`${prefix}-make`} name="make" value={draft.make} onChange={(event) => update("make", event.target.value)} className={selectClass}>
      <option value="">{copy.anyBrand}</option>{makes.map((make) => <option key={make}>{make}</option>)}
    </select></div>
    <div>{label("model")}<select id={`${prefix}-model`} name="model" value={draft.model} onChange={(event) => update("model", event.target.value)} className={selectClass}>
      <option value="">{copy.modelPlaceholder}</option>{models.map((model) => <option key={model}>{model}</option>)}
    </select></div>
    <div>{label("district")}<select id={`${prefix}-district`} name="district" value={draft.district} onChange={(event) => update("district", event.target.value)} className={selectClass}>
      <option value="">{copy.anyDistrict}</option>{districts.map((district) => <option key={district}>{district}</option>)}
    </select></div>
    <fieldset><legend className="mb-3 text-ui font-semibold">{copy.priceRange}</legend>{range(["minPrice", "maxPrice"], "price")}</fieldset>
    <fieldset><legend className="mb-3 text-ui font-semibold">{copy.manufactureYear}</legend>{range(["minYear", "maxYear"], "year")}</fieldset>
    <details open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)} className="border-t border-border">
      <summary className="min-h-12 cursor-pointer py-3 text-ui font-semibold">{copy.moreFilters}</summary>
      <div className="space-y-5 pb-2">
        <div>{label("transmission")}<select id={`${prefix}-transmission`} name="transmission" value={draft.transmission} onChange={(event) => update("transmission", event.target.value)} className={selectClass}>
          <option value="">{copy.anyTransmission}</option>{transmissionValues.map((value) => <option key={value} value={value}>{copy.transmissions[value]}</option>)}
        </select></div>
        <div>{label("fuel")}<select id={`${prefix}-fuel`} name="fuel" value={draft.fuel} onChange={(event) => update("fuel", event.target.value)} className={selectClass}>
          <option value="">{copy.anyFuel}</option>{fuelValues.map((value) => <option key={value} value={value}>{copy.fuels[value]}</option>)}
        </select></div>
        <fieldset><legend className="mb-3 text-ui font-semibold">{copy.mileage}</legend>{range(["minMileage", "maxMileage"], "mileage")}</fieldset>
      </div>
    </details>
    </div>
    <div className="flex shrink-0 flex-wrap gap-2 border-t border-border bg-surface pt-4 lg:flex-col lg:bg-background">
      <Button type="submit" className="min-w-0 flex-1">{copy.apply}</Button>
      <Button type="button" variant="ghost" onClick={() => setDraft({ ...emptyDraft })}>{copy.clearAll}</Button>
    </div>
  </form>;
}
