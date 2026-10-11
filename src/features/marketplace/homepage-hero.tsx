import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleSearch } from "@/features/vehicles/vehicle-search";
import { defaultSearch } from "@/features/vehicles/search-schema";
import { getDictionary } from "@/i18n/get-dictionary";

export function HomepageHero() {
  const { marketplace: copy, common } = getDictionary();
  return <section className="border-b border-border">
    <div className="site-container grid gap-7 py-8 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:py-5">
      <div>
        <p className="mb-4 border-s-2 border-accent ps-3 text-ui text-muted-foreground">{common.market}</p>
        <h1 className="text-display font-semibold">{copy.title}</h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">{copy.description}</p>
        <div className="mt-7"><VehicleSearch filters={defaultSearch} hero /></div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <Button asChild variant="outline" className="w-full sm:w-auto"><Link href="/sell">{copy.sell}<span className="text-muted-foreground">· {common.comingSoon}</span></Link></Button>
          <Link href="/vehicles" className="inline-flex min-h-12 items-center gap-2 rounded-sm text-ui font-medium text-primary underline underline-offset-4">{copy.viewAll}<ArrowRight aria-hidden="true" className="size-4" /></Link>
        </div>
        <p className="mt-2 text-ui text-muted-foreground">{copy.browseFreely}</p>
      </div>
      <figure className="min-w-0">
        <Image src="/images/automotive-hero.webp" alt={copy.heroAlt} width={1536} height={1024} sizes="(max-width: 1023px) 100vw, 50vw" preload className="aspect-[3/2] w-full rounded-md object-cover" />
        <figcaption className="mt-2 text-end text-ui text-muted-foreground">{copy.heroCaption}</figcaption>
      </figure>
    </div>
  </section>;
}
