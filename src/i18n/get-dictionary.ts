import { defaultLocale, type Locale } from "@/i18n/config";
import { en, type Dictionary } from "@/i18n/dictionaries/en";

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  // Explicit English fallback until reviewed Sinhala and Tamil dictionaries exist.
  switch (locale) {
    case "en":
    case "si":
    case "ta":
      return en;
  }
}
