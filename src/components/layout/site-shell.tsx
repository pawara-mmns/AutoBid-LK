import Link from "next/link";
import { ArrowUpRight, CarFront } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function SiteShell({ children, copy }: { children: ReactNode; copy: Dictionary["common"] }) {
  return (
    <div id="top" className="flex min-h-dvh flex-col">
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-50 rounded-md bg-primary p-4 text-primary-foreground focus:not-sr-only">
        {copy.skipToContent}
      </a>
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 sm:px-8">
          <Link href="/" aria-label={copy.brandLabel} className="flex min-h-11 items-center gap-2.5 rounded-sm text-xl font-bold tracking-tight">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <CarFront aria-hidden="true" className="size-6" />
            </span>
            {copy.brand}
          </Link>
          <nav aria-label={copy.navigation} className="flex flex-wrap items-center gap-1 sm:gap-3">
            <Button asChild variant="ghost"><Link href="/#our-approach">{copy.about}</Link></Button>
            <Button asChild variant="outline"><Link href="/#launch-update">{copy.status}<ArrowUpRight aria-hidden="true" /></Link></Button>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div><p className="font-semibold text-foreground">{copy.brand}</p><p className="mt-1">{copy.footer}</p></div>
          <p>{copy.languages}</p>
        </div>
      </footer>
    </div>
  );
}
