import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Bike, Bus, CarFront, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleSearch } from "@/features/vehicles/vehicle-search";
import { VehicleGrid, VehicleSkeletons } from "@/features/vehicles/vehicle-grid";
import { ListingState } from "@/features/vehicles/listing-state";
import { queryVehicles } from "@/features/vehicles/queries";
import { defaultSearch } from "@/features/vehicles/search-schema";
import { getDictionary } from "@/i18n/get-dictionary";

async function RecentlyAdded() {
  const result = await queryVehicles(defaultSearch, undefined, 6);
  return result.status === "ok" ? result.vehicles.length ? <VehicleGrid vehicles={result.vehicles} /> : <ListingState kind="empty" /> : <ListingState kind="error" />;
}

export function MarketplaceHome() {
  const { marketplace: copy, common } = getDictionary();
  const futureTypes = [{ label: copy.motorcycles, Icon: Bike }, { label: copy.vans, Icon: Bus }, { label: copy.threeWheelers, Icon: Truck }];
  return <>
    <section className="border-b border-border bg-muted/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:py-20">
        <div><p className="mb-5 flex items-center gap-2 text-sm font-semibold text-primary"><MapPin aria-hidden="true" className="size-4" />{common.market}</p>
          <h1 className="whitespace-pre-line text-4xl font-semibold leading-[1.12] tracking-tight sm:text-6xl">{copy.title}</h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">{copy.description}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-5 sm:p-8">
          <p className="mb-6 text-sm font-semibold text-primary">{copy.eyebrow}</p>
          <VehicleSearch filters={defaultSearch} hero />
          <div className="mt-5"><Link href="/sell" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4">{copy.sell}<ArrowRight aria-hidden="true" className="size-4" /></Link>
            <p className="mt-2 text-sm text-muted-foreground">{copy.sellNote}</p>
          </div>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
      <h2 className="text-xl font-semibold tracking-tight">{copy.categoriesTitle}</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Link href="/vehicles?category=car" className="flex min-h-24 items-center gap-3 rounded-lg border border-primary bg-primary px-4 py-5 text-primary-foreground"><CarFront aria-hidden="true" className="size-7 shrink-0" /><span className="font-semibold">{copy.cars}</span></Link>
        {futureTypes.map(({ label, Icon }) => <div key={label} className="flex min-h-24 items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-5 text-muted-foreground"><Icon aria-hidden="true" className="size-7 shrink-0" /><div><p className="font-semibold">{label}</p><p className="mt-1 text-xs">{copy.comingSoon}</p></div></div>)}
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-8 sm:pb-16">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.recentTitle}</h2><p className="mt-3 max-w-xl text-muted-foreground">{copy.recentDescription}</p></div>
        <Button asChild variant="outline"><Link href="/vehicles">{copy.viewAll}<ArrowRight aria-hidden="true" /></Link></Button>
      </div>
      <Suspense fallback={<VehicleSkeletons />}><RecentlyAdded /></Suspense>
    </section>
    <section id="how-it-works" className="border-t border-border bg-muted/60">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16"><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.howTitle}</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">{copy.steps.map((step, index) => <li key={step.title}>
          <span aria-hidden="true" className="mb-4 flex size-11 items-center justify-center rounded-full border border-border bg-background font-semibold text-primary">{index + 1}</span>
          <h3 className="text-lg font-semibold">{step.title}</h3><p className="mt-3 text-muted-foreground">{step.description}</p>
        </li>)}</ol>
      </div>
    </section>
  </>;
}
