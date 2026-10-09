import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

// Public reads never inherit a visitor's cookies or elevated credentials.
export function createPublicSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createClient<Database>(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, options) => fetch(url, { ...options, cache: "no-store", signal: AbortSignal.timeout(8000) }) },
  });
}
