"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig, supabaseCookieOptions } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export function createBrowserSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createBrowserClient<Database>(config.url, config.key, { cookieOptions: supabaseCookieOptions });
}
