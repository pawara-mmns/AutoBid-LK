import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";

import { SiteShell } from "@/components/layout/site-shell";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { publicEnv } from "@/lib/env";
import "./globals.css";

const dictionary = getDictionary();
const geist = localFont({ src: "./fonts/geist-variable.woff2", variable: "--font-geist", display: "swap", weight: "100 900" });
const sinhala = localFont({
  src: "./fonts/noto-sans-sinhala-variable.woff2", variable: "--font-sinhala", display: "swap",
  weight: "100 900", preload: false, adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0964-0965, U+0D81-0DF4, U+1CF2, U+200C-200D, U+25CC, U+111E1-111F4" }],
});
const tamil = localFont({
  src: "./fonts/noto-sans-tamil-variable.woff2", variable: "--font-tamil", display: "swap",
  weight: "100 900", preload: false, adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0964-0965, U+0B82-0BFA, U+200C-200D, U+20B9, U+25CC" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: dictionary.metadata.title,
  description: dictionary.metadata.description,
  // Keep the unfinished foundation out of search results until release readiness.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={defaultLocale} className={`${geist.variable} ${sinhala.variable} ${tamil.variable}`}>
      {/* Extensions may inject body attributes before hydration; keep child checks active. */}
      <body suppressHydrationWarning><SiteShell copy={dictionary.common}>{children}</SiteShell></body>
    </html>
  );
}
