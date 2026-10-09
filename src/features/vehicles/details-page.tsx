import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { VehicleGallery } from "@/features/vehicles/vehicle-gallery";
import { VehicleSpecifications } from "@/features/vehicles/vehicle-specifications";
import { VehiclePrice } from "@/features/vehicles/vehicle-price";
import { VehicleGrid } from "@/features/vehicles/vehicle-grid";
import { AuctionInformation } from "@/features/vehicles/auction-information";
import { queryRelatedVehicles } from "@/features/vehicles/queries";
import type { VehicleDetails, VehicleMedia } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

async function RelatedVehicles({ vehicle }: { vehicle: VehicleDetails }) {
  const result = await queryRelatedVehicles(vehicle);
  return result.status === "ok" && result.vehicles.length ? <section className="mt-12 border-t border-border pt-10"><h2 className="mb-6 text-2xl font-semibold">{getDictionary().vehicles.related}</h2><VehicleGrid vehicles={result.vehicles} /></section> : null;
}

export function DetailsPage({ vehicle, media }: { vehicle: VehicleDetails; media: VehicleMedia[] }) {
  const copy = getDictionary().vehicles;
  const title = `${vehicle.make} ${vehicle.model}`;
  const history = (value: boolean | null) => value === null ? copy.notStated : value ? copy.historyYes : copy.historyNo;
  return <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
    <Link href="/vehicles" className="mb-7 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary"><ArrowLeft aria-hidden="true" className="size-4" />{copy.back}</Link>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <VehicleGallery vehicleId={vehicle.id} title={title} media={media} />
      <div><p className="mb-3 text-sm text-muted-foreground">{copy.approved}</p><h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 flex flex-wrap items-center gap-3 text-muted-foreground"><span>{vehicle.manufacture_year}</span><span className="flex items-center gap-1"><MapPin aria-hidden="true" className="size-4" />{vehicle.district}</span></p>
        <div className="my-7 rounded-lg border border-border p-5"><VehiclePrice minor={vehicle.price_minor} /></div>
        <AuctionInformation />
        <section className="mt-6"><h2 className="text-lg font-semibold">{copy.reviewTitle}</h2><p className="mt-3 text-sm text-muted-foreground">{copy.reviewNotice}</p></section>
      </div>
    </div>
    <div className="mt-12 grid gap-10 lg:grid-cols-2">
      <VehicleSpecifications vehicle={vehicle} />
      <section><h2 className="text-2xl font-semibold tracking-tight">{copy.condition}</h2><p className="mt-5 whitespace-pre-line break-words text-muted-foreground">{vehicle.condition_description ?? copy.notStated}</p>
        <h3 className="mt-6 font-semibold">{copy.defects}</h3><p className="mt-2 whitespace-pre-line break-words text-muted-foreground">{vehicle.known_defects ?? copy.notStated}</p>
        <dl className="mt-6 space-y-3 text-sm"><div><dt className="font-semibold">{copy.accidentHistory}</dt><dd className="mt-1 text-muted-foreground">{history(vehicle.accident_history)}</dd></div>
          <div><dt className="font-semibold">{copy.floodHistory}</dt><dd className="mt-1 text-muted-foreground">{history(vehicle.flood_history)}</dd></div></dl>
        <p className="mt-6 rounded-md bg-muted p-4 text-sm text-muted-foreground">{copy.conditionNotice}</p>
      </section>
    </div>
    <RelatedVehicles vehicle={vehicle} />
  </div>;
}
