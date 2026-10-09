import Link from "next/link";
import { CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/get-dictionary";

export function ListingState({ kind, filtered = false }: { kind: "empty" | "error"; filtered?: boolean }) {
  const copy = getDictionary().vehicles;
  return <div className="rounded-lg border border-border bg-muted/40 px-5 py-12 text-center">
    <CarFront aria-hidden="true" className="mx-auto mb-5 size-10 text-primary" strokeWidth={1.5} />
    <h2 className="text-xl font-semibold">{kind === "error" ? copy.unavailableTitle : filtered ? copy.noResultsTitle : copy.emptyTitle}</h2>
    <p className="mx-auto mt-3 max-w-md text-muted-foreground">{kind === "error" ? copy.unavailableDescription : filtered ? copy.noResultsDescription : copy.emptyDescription}</p>
    <Button asChild variant="outline" className="mt-6"><Link href="/vehicles">{kind === "error" ? copy.tryAgain : filtered ? copy.clear : getDictionary().common.browse}</Link></Button>
  </div>;
}
