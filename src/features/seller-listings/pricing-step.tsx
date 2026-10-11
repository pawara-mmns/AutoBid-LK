"use client";
import { formatLkr } from "@/features/vehicles/money";
import { getSellerDictionary } from "@/i18n/get-dictionary";
import { SelectField, TextField, type StepProps } from "./fields";
import { priceMinor } from "./schema";
export function PricingStep(props: StepProps) {
  const c = getSellerDictionary();
  return <div className="space-y-6">{(["expectedPrice", "minimumPrice", "buyNowPrice"] as const).map((field) => <div key={field}><TextField {...props} field={field} inputMode="decimal" />{priceMinor(props.form[field]) !== null && props.form[field] && <p className="mt-2 text-ui text-muted-foreground">{formatLkr(priceMinor(props.form[field])!)}</p>}{field === "minimumPrice" && <p className="mt-2 text-ui text-muted-foreground">{c.minimumHelp}</p>}</div>)}<SelectField {...props} field="duration" options={Object.entries(c.durationLabels)} /><p className="border-s-2 border-primary ps-4 text-ui text-muted-foreground">{c.termsHelp}</p></div>;
}
