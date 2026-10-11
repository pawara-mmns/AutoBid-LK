import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleDetailsSkeleton() {
  return <div role="status" className="site-container py-8"><span className="sr-only">{getDictionary().vehicles.detailsLoading}</span>
    <div aria-hidden="true"><div className="mb-6 h-5 w-40 rounded bg-muted" /><div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="aspect-[4/3] rounded-md bg-muted" /><div className="space-y-5"><div className="h-9 w-3/4 rounded bg-muted" /><div className="h-5 w-2/3 rounded bg-muted" /><div className="h-5 w-1/2 rounded bg-muted" /><div className="h-10 w-3/4 rounded bg-muted" /><div className="h-24 rounded bg-muted" /></div>
    </div></div>
  </div>;
}
