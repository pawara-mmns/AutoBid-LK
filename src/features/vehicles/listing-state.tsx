import Link from "next/link";
import { CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/get-dictionary";

export function ListingState({ kind, filtered = false }: { kind: "empty" | "error"; filtered?: boolean }) {
  const copy = getDictionary().vehicles;
  return <div className="rounded-md border border-border bg-surface px-5 py-6 text-center">
    <CarFront aria-hidden="true" className="mx-auto mb-3 size-8 text-primary" strokeWidth={1.5} />
    <h2 className="text-lg font-medium">{kind === "error" ? copy.unavailableTitle : filtered ? copy.noResultsTitle : copy.emptyTitle}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{kind === "error" ? copy.unavailableDescription : filtered ? copy.noResultsDescription : copy.emptyDescription}</p>
    {(kind === "error" || filtered) && <Button asChild variant="outline" className="mt-5"><Link href="/vehicles">{kind === "error" ? copy.tryAgain : copy.clear}</Link></Button>}
  </div>;
}
