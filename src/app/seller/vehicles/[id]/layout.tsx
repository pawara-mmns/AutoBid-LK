import { sellerPageData } from "@/features/seller-listings/page-data";
export default async function SellerListingLayout({ params, children }: { params: Promise<{ id: string }>; children: React.ReactNode }) {
  await sellerPageData((await params).id); return children;
}
