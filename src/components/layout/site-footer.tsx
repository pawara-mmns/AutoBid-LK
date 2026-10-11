import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function SiteFooter({ copy }: { copy: Dictionary["common"] }) {
  return <footer className="border-t border-border bg-surface">
    <div className="site-container flex flex-col gap-5 py-4 text-ui text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-semibold text-foreground">{copy.brand}</p><p className="mt-1">{copy.footer}</p></div>
      <div>
        <nav aria-label={copy.footerNavigation} className="flex flex-wrap gap-x-5 gap-y-1">
          {Object.entries(copy.footerLinks).map(([path, label]) => <Link key={path} href={`/${path}`} className="inline-flex min-h-11 items-center rounded-sm hover:text-primary">{label}</Link>)}
        </nav>
        <p className="mt-2">{copy.languagesIntro}{" "}<span lang="en">{copy.languageNames.en}</span>. {copy.languagesPlanned}{" "}<span lang="si">{copy.languageNames.si}</span>, <span lang="ta">{copy.languageNames.ta}</span>.</p>
      </div>
    </div>
  </footer>;
}
