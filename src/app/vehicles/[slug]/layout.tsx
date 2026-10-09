import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getVehicleDetails } from "@/features/vehicles/queries";

export default async function VehicleVisibilityLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  // Resolve visibility before the child loading boundary can commit a 200 stream.
  // The request-local cached lookup is shared with the page and metadata.
  const result = await getVehicleDetails((await params).slug);
  if (result.status === "not-found") notFound();
  return children;
}
