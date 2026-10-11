import { defaultLocale, type Locale } from "@/i18n/config";
import { en, type Dictionary } from "@/i18n/dictionaries/en";
import { sellerEn, type SellerDictionary } from "@/i18n/dictionaries/seller-en";

export function getSellerDictionary(locale: Locale = defaultLocale): SellerDictionary {
  // No untranslated locale is offered. Future reviewed dictionaries share this shape.
  void locale;
  return sellerEn;
}

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  // Explicit English fallback until reviewed Sinhala and Tamil dictionaries exist.
  switch (locale) {
    case "en":
    case "si":
    case "ta":
      return en;
  }
}
