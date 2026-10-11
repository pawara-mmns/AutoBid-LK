import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary, getSellerDictionary } from "@/i18n/get-dictionary";

export type InformationKind = "about" | "contact" | "help" | "terms" | "privacy" | "sell";
export function InformationPage({ kind }: { kind: InformationKind }) {
  const copy = getDictionary().information;
  const marketplace = getDictionary().marketplace;
  return <article className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy[kind].title}</h1>
    <div className="mt-7 space-y-5 text-muted-foreground">{copy[kind].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
    {kind === "sell" && <ol className="mt-8 divide-y divide-border border-y border-border">
      {marketplace.sellingSteps.map((step, index) => <li key={step} className="flex items-center gap-4 py-4"><span aria-hidden="true" className="text-sm tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><span className="font-medium">{step}</span></li>)}
    </ol>}
    {kind === "sell" && <div className="mt-8 flex flex-wrap gap-3"><Button asChild><Link href="/seller/vehicles/new">{getSellerDictionary().start}</Link></Button><Button asChild variant="outline"><Link href="/seller/vehicles">{getSellerDictionary().dashboard}</Link></Button></div>}
    <Button asChild variant={kind === "sell" ? "ghost" : "default"} className="mt-8"><Link href="/vehicles">{copy.back}</Link></Button>
  </article>;
}
