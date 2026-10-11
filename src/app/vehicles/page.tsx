import { BrowsePage } from "@/features/vehicles/browse-page";
import type { SearchParams } from "@/features/vehicles/search-schema";
import { Suspense } from "react";
import { VehicleSkeletons } from "@/features/vehicles/vehicle-grid";

export const dynamic = "force-dynamic";
export default async function VehiclesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  return <Suspense key={JSON.stringify(params)} fallback={<div className="site-container py-8 sm:py-10"><VehicleSkeletons /></div>}><BrowsePage searchParams={params} /></Suspense>;
}
