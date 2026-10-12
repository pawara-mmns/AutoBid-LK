import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatLkr } from "@/features/vehicles/money";
import { getSellerDictionary } from "@/i18n/get-dictionary";
import type { SellerListing } from "./queries";

export function SellerDashboard({ listings, covers, page, hasMore }: { listings: SellerListing[] | null; covers: { id: string; listing_id: string }[]; page: number; hasMore: boolean }) {
  const c = getSellerDictionary();
  return <div className="site-container max-w-5xl py-8 sm:py-12">
    <header className="flex flex-wrap items-center justify-between gap-5"><h1 className="text-3xl font-semibold tracking-tight">{c.dashboard}</h1><Button asChild><Link href="/seller/vehicles/new">{c.sellAnother}</Link></Button></header>
    {listings === null ? <p role="alert" className="mt-8">{c.unavailable}</p> : listings.length === 0 ? <p className="mt-10 border-y border-border py-10 text-muted-foreground">{c.empty}</p> : <ul className="mt-8 divide-y divide-border border-y border-border">{listings.map((listing) => {
      const d = listing.details as Record<string, string>; const status = c.statuses[listing.status as keyof typeof c.statuses];
      const cover = covers.find((photo) => photo.listing_id === listing.id);
      return <li key={listing.id} className="grid gap-5 py-6 sm:grid-cols-[10rem_minmax(0,1fr)]"><div>{cover ? <Image src={`/seller/vehicles/${listing.id}/photos/${cover.id}`} unoptimized alt={[d.make, d.model].filter(Boolean).join(" ") || c.untitled} width={640} height={480} className="aspect-[4/3] w-full rounded-md object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-muted px-3 text-ui text-muted-foreground">{c.noPhoto}</div>}</div><div className="flex min-w-0 flex-wrap items-start justify-between gap-5"><div className="min-w-0"><h2 className="break-words text-xl font-semibold">{[d.make, d.model, d.year].filter(Boolean).join(" ") || c.untitled}</h2><p className="mt-2 font-medium">{listing.expected_price_minor ? formatLkr(listing.expected_price_minor) : c.noPrice}</p><p className="mt-3 text-primary">{status.label}</p><p className="text-ui text-muted-foreground">{status.help}</p>{listing.public_feedback && <p className="mt-3 whitespace-pre-wrap break-words text-ui"><span className="font-medium">{c.feedback}: </span>{listing.public_feedback}</p>}<p className="mt-2 text-ui text-muted-foreground">{c.updated}: {new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(listing.updated_at))}</p></div><Button asChild variant="outline"><Link href={`/seller/vehicles/${listing.id}`}>{listing.status === "draft" ? c.resume : c.view}</Link></Button></div></li>;
    })}</ul>}
    {(page > 1 || hasMore) && <nav aria-label={c.pageNavigation} className="mt-6 flex flex-wrap gap-3">{page > 1 && <Button asChild variant="outline"><Link href={`/seller/vehicles?page=${page - 1}`}>{c.previousPage}</Link></Button>}{hasMore && <Button asChild variant="outline" className="ms-auto"><Link href={`/seller/vehicles?page=${page + 1}`}>{c.nextPage}</Link></Button>}</nav>}
  </div>;
}
