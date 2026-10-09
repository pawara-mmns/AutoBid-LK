import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig, supabaseCookieOptions } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export async function createServerSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. Proxy refreshes before rendering.
        }
      },
    },
  });
}
