import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleTrustInformation() {
  const copy = getDictionary().vehicles;
  return <section aria-labelledby="vehicle-trust" className="mt-10 border-t border-border pt-8">
    <h2 id="vehicle-trust" className="text-section font-semibold">{copy.reviewTitle}</h2>
    <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:gap-10">
      <p className="max-w-2xl text-muted-foreground">{copy.reviewNotice}</p>
      <p className="max-w-2xl text-muted-foreground">{copy.conditionNotice}</p>
    </div>
  </section>;
}
