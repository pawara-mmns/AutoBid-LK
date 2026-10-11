import { SellerListingWizard } from "@/features/seller-listings/seller-listing-wizard";
import { sellerPageData } from "@/features/seller-listings/page-data";
export const dynamic = "force-dynamic";
export default async function SellerListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { listing, photos, email } = await sellerPageData((await params).id);
  return <SellerListingWizard listing={listing} initialPhotos={photos} accountEmail={email} />;
}
