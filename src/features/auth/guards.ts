import "server-only";
import { redirect } from "next/navigation";
import { getValidatedUser, hasAdminGrant } from "@/features/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { authDestination } from "@/features/auth/redirects";

export async function requireUser(requestedDestination: string = "/account") {
  const destination = authDestination(requestedDestination);
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
