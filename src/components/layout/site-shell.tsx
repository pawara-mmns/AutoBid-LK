import type { ReactNode } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function SiteShell({ children, copy }: { children: ReactNode; copy: Dictionary["common"] }) {
  return (
    <div id="top" className="flex min-h-dvh flex-col">
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-50 rounded-md bg-primary p-4 text-primary-foreground focus:not-sr-only">
        {copy.skipToContent}
      </a>
      <SiteHeader copy={copy} />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</main>
      <SiteFooter copy={copy} />
    </div>
  );
}
