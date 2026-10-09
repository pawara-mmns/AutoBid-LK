import { z } from "zod";
import { publicEnv } from "@/lib/env";

export const supabaseCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure: new URL(publicEnv.NEXT_PUBLIC_SITE_URL).protocol === "https:",
};

const configSchema = z.object({
  url: z.url().refine((value) => {
    try {
      const url = new URL(value);
      return !url.username && !url.password && !url.search && !url.hash &&
        (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)));
    } catch { return false; }
  }),
  key: z.string().refine((value) => {
    if (value.startsWith("sb_publishable_") && value.length > 20) return true;
    // Local Supabase uses legacy anon JWT keys. Never accept an elevated key.
    try {
      const parts = value.split(".");
      if (parts.length !== 3 || !parts[1]) return false;
      const payload: unknown = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return typeof payload === "object" && payload !== null && "role" in payload && payload.role === "anon";
    } catch { return false; }
  }),
});

export type SupabaseConfig = z.infer<typeof configSchema>;

export function parseSupabaseConfig(input: {
  NEXT_PUBLIC_SUPABASE_URL?: string; NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}): SupabaseConfig | null {
  const result = configSchema.safeParse({ url: input.NEXT_PUBLIC_SUPABASE_URL, key: input.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
  return result.success ? result.data : null;
}

export function getSupabaseConfig() {
  return parseSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
