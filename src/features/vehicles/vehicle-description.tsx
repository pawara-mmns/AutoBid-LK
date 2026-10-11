import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleDescription({ description }: { description: string | null }) {
  if (!description?.trim()) return null;
  return <section aria-labelledby="vehicle-description" className="mt-10 border-t border-border pt-8">
    <h2 id="vehicle-description" className="text-section font-semibold">{getDictionary().vehicles.sellerDescription}</h2>
    <p className="mt-4 max-w-3xl whitespace-pre-line break-words text-muted-foreground">{description}</p>
  </section>;
}
