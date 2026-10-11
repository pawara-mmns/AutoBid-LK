import { requireUser } from "@/features/auth/guards";
import { loadSellerListings } from "@/features/seller-listings/queries";
import { SellerDashboard } from "@/features/seller-listings/dashboard";
import { loadSellerCovers } from "@/features/seller-listings/photos";
export const dynamic = "force-dynamic";
export default async function MyVehiclesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { client, user } = await requireUser("/seller/vehicles");
  const requested = (await searchParams).page; const page = requested && /^\d{1,4}$/.test(requested) && Number(requested) >= 1 && Number(requested) <= 1000 ? Number(requested) : 1;
  const result = await loadSellerListings(client, user.id, page);
  return <SellerDashboard listings={result?.rows ?? null} covers={await loadSellerCovers(client, result?.rows.map((row) => row.id) ?? [])} page={page} hasMore={result?.hasMore ?? false} />;
}
