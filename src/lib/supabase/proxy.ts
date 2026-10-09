import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, supabaseCookieOptions } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  const config = getSupabaseConfig();
  if (!config) return response;

  const supabase = createServerClient<Database>(config.url, config.key, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const previousCookies = response.cookies.getAll();
        const previousHeaders = new Headers(response.headers);
        response = NextResponse.next({ request });
        previousCookies.forEach((cookie) => response.cookies.set(cookie));
        // Preserve caching rules, not old x-middleware request-header overrides.
        for (const key of ["cache-control", "expires", "pragma", "referrer-policy"]) {
          const value = previousHeaders.get(key);
          if (value) response.headers.set(key, value);
        }
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(cacheHeaders).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });
  try {
    await supabase.auth.getClaims();
  } catch {
    // Routes/actions independently validate the user and fail closed on Auth outages.
  }
  return response;
}
