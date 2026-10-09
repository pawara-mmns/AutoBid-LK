import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().refine((value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }).default("http://localhost:3000"),
});

export function parsePublicEnv(input: { NEXT_PUBLIC_SITE_URL?: string }) {
  const result = publicEnvSchema.safeParse(input);
  if (!result.success) {
    // Do not include environment values in error messages or logs.
    throw new Error("Invalid NEXT_PUBLIC_SITE_URL. Use an HTTP(S) URL without credentials.");
  }
  return result.data;
}

export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
