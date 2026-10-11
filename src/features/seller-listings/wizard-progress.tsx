import { getSellerDictionary } from "@/i18n/get-dictionary";
export function WizardProgress({ step }: { step: number }) {
  const c = getSellerDictionary(); return <div className="mb-8"><p className="text-ui text-muted-foreground">{c.step} {step} {c.of} 5 · {c.steps[step - 1]}</p><div aria-hidden="true" className="mt-3 flex gap-2">{c.steps.map((label, i) => <span key={label} className={`h-1 flex-1 rounded-sm ${i < step ? "bg-primary" : "bg-border"}`} />)}</div></div>;
}
