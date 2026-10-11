import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehiclePhoto } from "@/features/vehicles/vehicle-photo";
import { VehiclePrice } from "@/features/vehicles/vehicle-price";
import type { VehicleCardData } from "@/features/vehicles/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleCard({ vehicle }: { vehicle: VehicleCardData }) {
  const copy = getDictionary().vehicles;
  const title = `${vehicle.make} ${vehicle.model}`;
  return <article className="overflow-hidden rounded-md border border-border bg-surface">
    <Link href={`/vehicles/${vehicle.slug}`} aria-label={`${copy.viewDetails}: ${title}`} className="block">
      <VehiclePhoto src={vehicle.photo ? `/vehicle-images/${vehicle.id}/${vehicle.photo.id}` : undefined} alt={vehicle.photo?.alt_text ?? copy.photoAlt.replace("{vehicle}", title).replace("{number}", "1")} />
    </Link>
    <div className="p-4 sm:p-5">
      <h3 className="break-words text-lg font-semibold leading-snug"><Link href={`/vehicles/${vehicle.slug}`} className="inline-flex min-h-11 items-center rounded-sm hover:text-primary">{title}</Link></h3>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"><span>{vehicle.manufacture_year}</span><span className="flex items-center gap-1"><MapPin aria-hidden="true" className="size-3.5" />{vehicle.district}</span></p>
      <p className="mt-2 min-h-6 text-sm text-muted-foreground">{vehicle.mileage_km === null ? `${copy.mileage}: ${copy.notStated}` : copy.kilometres.replace("{count}", new Intl.NumberFormat("en-LK").format(vehicle.mileage_km))}</p>
      <div className="mt-4"><VehiclePrice minor={vehicle.price_minor} /></div>
      <Button asChild variant="ghost" className="mt-2 w-full justify-between px-0 text-primary hover:bg-transparent hover:underline"><Link href={`/vehicles/${vehicle.slug}`}>{copy.viewDetails}<ArrowUpRight aria-hidden="true" /></Link></Button>
    </div>
  </article>;
}
