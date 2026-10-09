"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/features/auth/types";
import { saveOwnProfile } from "@/features/profiles/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function saveProfileAction(_previous: FormState, form: FormData) {
  const result = await saveOwnProfile({ displayName: form.get("displayName"), preferredLocale: form.get("preferredLocale") }, createServerSupabaseClient);
  if (result.status === "success") revalidatePath("/account");
  return result;
}

export async function requestDealerAction(_previous: FormState, form: FormData) {
  const result = await saveOwnProfile({ businessName: form.get("businessName") }, createServerSupabaseClient, true);
  if (result.status === "success") revalidatePath("/account");
  return result;
}
