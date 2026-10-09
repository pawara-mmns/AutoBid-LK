import "server-only";
import type { User } from "@supabase/supabase-js";
import type { AppSupabaseClient } from "@/features/auth/types";

export async function getValidatedUser(client: AppSupabaseClient): Promise<User | null> {
  try {
    // getUser validates with Auth and retrieves the current account; never trust getSession.
    const { data, error } = await client.auth.getUser();
    if (error || !data.user?.email || !data.user.email_confirmed_at || data.user.is_anonymous) return null;
    return data.user;
  } catch { return null; }
}

export async function hasAdminGrant(client: AppSupabaseClient, userId: string) {
  try {
    const { data, error } = await client.from("admin_grants").select("user_id").eq("user_id", userId).maybeSingle();
    return !error && data?.user_id === userId;
  } catch { return false; }
}

export function accountPermissions(dealerStatus?: string | null) {
  return { buyer: true, seller: true, dealer: dealerStatus === "verified" };
}
