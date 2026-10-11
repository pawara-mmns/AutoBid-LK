import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { VehiclePhoto } from "@/features/vehicles/vehicle-photo";
import { VehiclePrice } from "@/features/vehicles/vehicle-price";
import type { VehicleCardData } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleCard({ vehicle, photoSizes, returnTo }: { vehicle: VehicleCardData; photoSizes?: string; returnTo?: string }) {
  const copy = getDictionary().vehicles;
  const title = `${vehicle.make} ${vehicle.model}`;
  return <article className="h-full min-w-0">
    <Link href={`/vehicles/${vehicle.slug}${returnTo ? `?${new URLSearchParams({ from: returnTo })}` : ""}`} aria-label={`${copy.viewDetails}: ${title}, ${vehicle.manufacture_year}`} className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface hover:border-control-border">
      <VehiclePhoto sizes={photoSizes} src={vehicle.photo ? `/vehicle-images/${vehicle.id}/${vehicle.photo.id}` : undefined} alt={vehicle.photo?.alt_text ?? copy.photoAlt.replace("{vehicle}", title).replace("{number}", "1")} />
    <div className="flex flex-1 flex-col p-4 sm:p-5">
      <h3 className="break-words text-lg font-semibold leading-snug group-hover:text-primary">{title}</h3>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-ui text-muted-foreground"><span>{vehicle.manufacture_year}</span><span>{vehicle.district}</span></p>
      <p className="mt-2 text-ui text-muted-foreground">{vehicle.mileage_km === null ? `${copy.mileage}: ${copy.notStated}` : copy.kilometres.replace("{count}", new Intl.NumberFormat("en-LK").format(vehicle.mileage_km))}</p>
      <div className="mt-auto pt-5"><VehiclePrice minor={vehicle.price_minor} /></div>
      <p className="mt-3 text-ui text-muted-foreground">{copy.approved}</p>
      <span className="mt-3 flex min-h-11 items-center justify-between gap-2 border-t border-border pt-3 text-ui font-medium text-primary group-hover:underline">{copy.viewDetails}<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" /></span>
    </div>
    </Link>
  </article>;
}
