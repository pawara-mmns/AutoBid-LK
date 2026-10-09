import { getDictionary } from "@/i18n/get-dictionary";

// Phase 5 can replace this boundary with confirmed auction data; no simulated activity.
export function AuctionInformation() {
  const copy = getDictionary().vehicles;
  return <section className="rounded-lg border border-border bg-muted/60 p-5"><h2 className="text-lg font-semibold">{copy.auctionTitle}</h2><p className="mt-3 text-sm text-muted-foreground">{copy.auctionDescription}</p></section>;
}
