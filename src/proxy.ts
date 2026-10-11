import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Keep the static public homepage independent of sessions and auth availability.
export const config = {
  matcher: ["/account/:path*", "/seller/:path*", "/admin/:path*", "/sign-in", "/sign-up", "/forgot-password", "/auth/:path*"],
};
