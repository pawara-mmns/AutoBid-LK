import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function SiteHeader({ copy }: { copy: Dictionary["common"] }) {
  return <header className="border-b border-border bg-surface">
    <div className="site-container flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
      <Link href="/" aria-label={copy.brandLabel} className="flex min-h-12 items-center rounded-sm text-2xl font-semibold tracking-[-0.04em]">{copy.brand}</Link>
      <nav aria-label={copy.navigation} className="hidden items-center gap-2 md:flex">
        <Button asChild variant="ghost"><Link href="/vehicles">{copy.browse}</Link></Button>
        <Link href="/sell" className="inline-flex min-h-12 flex-wrap items-center gap-x-2 rounded-sm px-4 text-ui text-muted-foreground">{copy.sell}<span>· {copy.comingSoon}</span></Link>
        <Button asChild variant="ghost"><Link href="/account">{copy.account}</Link></Button>
      </nav>
      <MobileNavigation />
    </div>
  </header>;
}
