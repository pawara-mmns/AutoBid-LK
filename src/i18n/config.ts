export const supportedLocales = ["en", "si", "ta"] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = "en";

// Only English is available in Phase 0. Do not offer untranslated language options.
export const availableLocales = ["en"] as const satisfies readonly Locale[];

export const market = {
  countryCode: "LK",
  currency: "LKR",
  timeZone: "Asia/Colombo",
} as const;
