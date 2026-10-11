import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVehicleDetails } from "@/features/vehicles/queries";
import { DetailsPage } from "@/features/vehicles/details-page";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { vehiclesReturnUrl } from "@/features/vehicles/navigation";
import type { SearchParams } from "@/features/vehicles/search-schema";
import { getDictionary } from "@/i18n/get-dictionary";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getVehicleDetails((await params).slug);
  const copy = getDictionary();
  return { title: result.status === "ok" ? copy.vehicles.detailTitle.replace("{vehicle}", `${result.vehicle.make} ${result.vehicle.model}`).replace("{year}", String(result.vehicle.manufacture_year)).replace("{brand}", copy.common.brand) : copy.vehicles.detailsUnavailableTitle };
}
export default async function VehicleDetailPage({ params, searchParams }: Props) {
  const result = await getVehicleDetails((await params).slug);
  if (result.status === "not-found") notFound();
  const returnTo = vehiclesReturnUrl((await searchParams).from);
  if (result.status !== "ok") {
    const copy = getDictionary().vehicles;
    return <section className="site-container py-12"><h1 className="text-3xl font-semibold">{copy.detailsUnavailableTitle}</h1><p className="mt-3 text-muted-foreground">{copy.detailsUnavailableDescription}</p><Button asChild variant="outline" className="mt-6"><Link href={returnTo}>{copy.back}</Link></Button></section>;
  }
  return <DetailsPage vehicle={result.vehicle} media={result.media} returnTo={returnTo} />;
}
