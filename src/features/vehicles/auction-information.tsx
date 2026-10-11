import { getDictionary } from "@/i18n/get-dictionary";

// Phase 5 can replace this boundary with confirmed auction data; no simulated activity.
export function AuctionInformation() {
  const copy = getDictionary().vehicles;
  return <section className="mt-5 border-s-2 border-border ps-4"><h2 className="font-medium">{copy.auctionTitle}</h2><p className="mt-2 text-sm text-muted-foreground">{copy.auctionDescription}</p></section>;
}
