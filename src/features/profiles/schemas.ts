import { z } from "zod";
import { supportedLocales } from "@/i18n/config";

export const profileSchema = z.object({
  displayName: z.string().trim().max(80).refine((value) => value.length === 0 || value.length >= 2),
  preferredLocale: z.enum(supportedLocales),
}).strict();
export const dealerSchema = z.object({ businessName: z.string().trim().min(2).max(120) }).strict();
