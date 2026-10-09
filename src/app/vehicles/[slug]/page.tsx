import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVehicleDetails } from "@/features/vehicles/queries";
import { DetailsPage } from "@/features/vehicles/details-page";
import { ListingState } from "@/features/vehicles/listing-state";
import { getDictionary } from "@/i18n/get-dictionary";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getVehicleDetails((await params).slug);
  return { title: result.status === "ok" ? `${result.vehicle.make} ${result.vehicle.model} ${result.vehicle.manufacture_year} | AutoBid LK` : getDictionary().vehicles.title };
}
export default async function VehicleDetailPage({ params }: Props) {
  const result = await getVehicleDetails((await params).slug);
  if (result.status === "not-found") notFound();
  if (result.status !== "ok") return <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8"><ListingState kind="error" /></div>;
  return <DetailsPage vehicle={result.vehicle} media={result.media} />;
}
