import Link from "next/link";
import { CarFront } from "lucide-react";
import { getDictionary } from "@/i18n/get-dictionary";

export function VehicleCategoryList() {
  const copy = getDictionary().marketplace;
  return <div className="site-container">
    <div className="flex items-center gap-4 border-b border-border py-3">
      <CarFront aria-hidden="true" className="size-7 shrink-0 text-primary" strokeWidth={1.5} />
      <div><Link href="/vehicles?category=car" className="inline-flex min-h-11 items-center rounded-sm font-medium hover:text-primary">{copy.usedCars}</Link><p className="text-ui text-muted-foreground">{copy.categoryNote}</p></div>
    </div>
  </div>;
}
