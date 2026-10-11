import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { VehicleGallery } from "@/features/vehicles/vehicle-gallery";
import { VehicleSpecifications } from "@/features/vehicles/vehicle-specifications";
import { VehicleHighlights } from "@/features/vehicles/vehicle-highlights";
import { VehiclePricePanel } from "@/features/vehicles/vehicle-price-panel";
import { VehicleCondition } from "@/features/vehicles/vehicle-condition";
import { VehicleDescription } from "@/features/vehicles/vehicle-description";
import { VehicleTrustInformation } from "@/features/vehicles/vehicle-trust-information";
import { RelatedVehicles } from "@/features/vehicles/related-vehicles";
import type { VehicleDetails, VehicleMedia } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function DetailsPage({ vehicle, media, returnTo = "/vehicles" }: { vehicle: VehicleDetails; media: VehicleMedia[]; returnTo?: string }) {
  const copy = getDictionary().vehicles;
  const title = `${vehicle.make} ${vehicle.model}`;
  return <div className="site-container py-5 sm:py-8">
    <nav aria-label={copy.breadcrumb} className="mb-5"><ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ui">
      <li><Link href={returnTo} className="inline-flex min-h-11 items-center gap-2 rounded-sm font-medium text-primary"><ArrowLeft aria-hidden="true" className="size-4" />{copy.back}</Link></li>
      <li className="hidden text-muted-foreground sm:block"><span aria-hidden="true" className="me-3">/</span><span aria-current="page">{copy.detailLabel}</span></li>
    </ol></nav>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-8">
      <VehicleGallery key={vehicle.id} vehicleId={vehicle.id} title={title} media={media} />
      <div className="min-w-0"><header><h1 className="break-words text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1><VehicleHighlights vehicle={vehicle} /></header>
        <VehiclePricePanel minor={vehicle.price_minor} />
      </div>
    </div>
    <div className="mt-10 grid gap-10 border-t border-border pt-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <VehicleCondition vehicle={vehicle} /><VehicleSpecifications vehicle={vehicle} />
    </div>
    <VehicleDescription description={vehicle.condition_description} />
    <VehicleTrustInformation />
    <Suspense fallback={<p role="status" className="mt-10 text-ui text-muted-foreground">{copy.relatedLoading}</p>}><RelatedVehicles vehicle={vehicle} /></Suspense>
  </div>;
}
