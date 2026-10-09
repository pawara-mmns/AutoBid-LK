import { BrowsePage } from "@/features/vehicles/browse-page";
import type { SearchParams } from "@/features/vehicles/search-schema";
import { Suspense } from "react";
import { VehicleSkeletons } from "@/features/vehicles/vehicle-grid";

export const dynamic = "force-dynamic";
export default async function VehiclesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <Suspense fallback={<div className="mx-auto max-w-6xl px-5 py-12 sm:px-8"><VehicleSkeletons /></div>}><BrowsePage searchParams={await searchParams} /></Suspense>;
}
