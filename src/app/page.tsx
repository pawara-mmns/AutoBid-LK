import { ArrowRight, MapPin, Route } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/get-dictionary";

export default function HomePage() {
  const { home: copy, common } = getDictionary();

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16 lg:py-20">
        <div>
          <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-primary"><MapPin aria-hidden="true" className="size-4" />{common.market}</p>
          <p className="mb-3 text-sm text-muted-foreground">{copy.eyebrow}</p>
          <h1 className="whitespace-pre-line text-4xl font-bold leading-[1.12] tracking-tight sm:text-6xl">{copy.title}</h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">{copy.description}</p>
          <Button asChild className="mt-8 w-full sm:w-auto"><a href="#our-approach">{copy.action}<ArrowRight aria-hidden="true" /></a></Button>
          <div className="mt-7 max-w-lg border-l-2 border-border pl-4">
            <p className="text-sm font-semibold">{copy.availability}</p>
            <p className="mt-1 text-sm text-muted-foreground">{copy.availabilityDescription}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl bg-primary p-8 text-primary-foreground sm:p-10">
          <div aria-hidden="true" className="absolute -right-16 -top-16 size-64 rounded-full border-[40px] border-white/5" />
          <Route aria-hidden="true" className="relative mb-12 size-12 text-accent" strokeWidth={1.5} />
          <p className="relative mb-3 text-sm text-accent">{copy.previewLabel}</p>
          <h2 className="relative whitespace-pre-line text-4xl font-semibold leading-tight tracking-tight">{copy.previewTitle}</h2>
          <p className="relative mt-5 max-w-xs text-base text-white/85">{copy.previewDescription}</p>
          <p className="relative mt-10 border-t border-white/20 pt-5 text-sm text-accent">{copy.previewNote}</p>
        </div>
      </section>
      <section id="our-approach" aria-labelledby="approach-title" className="border-y border-border bg-muted/60">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-sm font-semibold text-primary">{copy.approachEyebrow}</p>
          <h2 id="approach-title" className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{copy.approachTitle}</h2>
          <p className="mt-4 text-muted-foreground">{copy.approachDescription}</p>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {copy.principles.map((principle, index) => (
              <li key={principle.title}>
                <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-primary">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-5 text-lg font-semibold">{principle.title}</h3>
                <p className="mt-2 text-muted-foreground">{principle.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section id="launch-update" aria-labelledby="launch-title" className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:px-8 sm:py-16 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-primary">{copy.availability}</p>
          <h2 id="launch-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.statusTitle}</h2>
          <p className="mt-4 text-muted-foreground">{copy.statusDescription}</p>
        </div>
        <Button asChild variant="outline" className="shrink-0"><a href="#top">{copy.backToTop}</a></Button>
      </section>
    </>
  );
}
