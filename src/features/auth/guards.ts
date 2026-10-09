import "server-only";
import { redirect } from "next/navigation";
import { getValidatedUser, hasAdminGrant } from "@/features/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireUser(destination: "/account" | "/account/password" | "/admin" = "/account") {
  const client = await createServerSupabaseClient();
  if (!client) redirect(`/sign-in?message=unavailable&next=${encodeURIComponent(destination)}`);
  const user = await getValidatedUser(client);
  if (!user) redirect(`/sign-in?message=sessionRequired&next=${encodeURIComponent(destination)}`);
  return { client, user };
}

export async function requireAdmin() {
  const context = await requireUser("/admin");
  if (!await hasAdminGrant(context.client, context.user.id)) redirect("/account?message=accessDenied");
  return context;
}
