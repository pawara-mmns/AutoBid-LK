import { getDictionary } from "@/i18n/get-dictionary";

export function HowItWorks() {
  const copy = getDictionary().marketplace;
  return <section id="how-it-works" className="border-t border-border bg-surface">
    <div className="site-container py-6"><h2 className="text-xl font-semibold tracking-tight">{copy.howTitle}</h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-[3fr_1fr]">
        <ol className="grid gap-6 md:grid-cols-3">{copy.steps.map((step, index) => <li key={step.title} className="flex items-start gap-4">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-primary">{index + 1}</span>
          <div><h3 className="font-medium">{step.title}</h3><p className="mt-2 text-ui text-muted-foreground">{step.description}</p></div>
        </li>)}</ol>
        <p className="border-t border-border pt-4 text-ui text-muted-foreground lg:border-s lg:border-t-0 lg:ps-6 lg:pt-0">{copy.sellNote} {copy.biddingNote}</p>
      </div>
    </div>
  </section>;
}
