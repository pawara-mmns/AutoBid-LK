import { SlidersHorizontal } from "lucide-react";
import { ModalDrawer } from "@/components/ui/modal-drawer";
import { VehicleFilterForm } from "@/features/vehicles/vehicle-filter-form";
import { filterKeys, type VehicleSearch } from "@/features/vehicles/search-schema";
import type { VehicleFacets } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleFilters({ filters, facets, display }: { filters: VehicleSearch; facets: VehicleFacets; display: "mobile" | "desktop" }) {
  const copy = getDictionary();
  const count = filterKeys.filter((key) => key !== "q" && filters[key] !== undefined).length;
  const form = <VehicleFilterForm key={JSON.stringify(filters)} filters={filters} facets={facets} prefix={display} />;
  return display === "mobile"
    ? <div className="lg:hidden"><ModalDrawer fullHeight title={copy.vehicles.filters} closeLabel={copy.common.close}
        trigger={<><SlidersHorizontal aria-hidden="true" /><span>{copy.vehicles.filters}{count ? ` (${count})` : ""}</span></>}>{form}</ModalDrawer></div>
    : <aside aria-label={copy.vehicles.filters} className="hidden self-start border-e border-border pe-6 lg:block">
        <h2 className="mb-5 text-lg font-semibold">{copy.vehicles.filters}</h2>{form}
      </aside>;
}
