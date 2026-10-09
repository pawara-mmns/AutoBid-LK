import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { publicEnv } from "@/lib/env";
import "./globals.css";

const dictionary = getDictionary();

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: dictionary.metadata.title,
  description: dictionary.metadata.description,
  // Keep the unfinished foundation out of search results until release readiness.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={defaultLocale}>
      <body><SiteShell copy={dictionary.common}>{children}</SiteShell></body>
    </html>
  );
}
