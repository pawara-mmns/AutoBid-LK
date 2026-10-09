import { NextResponse, type NextRequest } from "next/server";
import { confirmAuthLink } from "@/features/auth/confirmation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const destination = await confirmAuthLink(request.nextUrl.searchParams, createServerSupabaseClient, "token");
  return NextResponse.redirect(new URL(destination, publicEnv.NEXT_PUBLIC_SITE_URL), {
    headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}
