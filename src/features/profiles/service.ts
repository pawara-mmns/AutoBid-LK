import "server-only";
import { getValidatedUser } from "@/features/auth/authorization";
import type { AppSupabaseClient, ClientFactory, FormState } from "@/features/auth/types";
import { dealerSchema, profileSchema } from "@/features/profiles/schemas";

export async function loadOwnProfile(client: AppSupabaseClient, userId: string) {
  const [profile, dealer] = await Promise.all([
    client.from("profiles").select("id, display_name, preferred_locale").eq("id", userId).single(),
    client.from("dealer_profiles").select("business_name, verification_status").eq("user_id", userId).maybeSingle(),
  ]);
  if (profile.error || dealer.error) return null;
  return { profile: profile.data, dealer: dealer.data };
}

export async function saveOwnProfile(input: unknown, createClient: ClientFactory, dealer = false): Promise<FormState> {
  const client = await createClient();
  if (!client) return { status: "error", message: "unavailable" };
  const user = await getValidatedUser(client);
  if (!user) return { status: "error", message: "sessionRequired" };
  const parsed = (dealer ? dealerSchema : profileSchema).safeParse(input);
  if (!parsed.success) return { status: "error", message: "invalidInput", fields: parsed.error.issues.map((issue) => String(issue.path[0] ?? "")) };
  try {
    if (dealer) {
      const data = dealerSchema.parse(parsed.data);
      const { error } = await client.from("dealer_profiles").insert({ user_id: user.id, business_name: data.businessName });
      return error ? { status: "error", message: "profileFailed" } : { status: "success", message: "dealerRequested" };
    }
    const data = profileSchema.parse(parsed.data);
    const { data: updated, error } = await client.from("profiles").update({ display_name: data.displayName || null, preferred_locale: data.preferredLocale })
      .eq("id", user.id).select("id").single();
    return error || !updated ? { status: "error", message: "profileFailed" } : { status: "success", message: "profileSaved" };
  } catch { return { status: "error", message: "tryAgain" }; }
}
