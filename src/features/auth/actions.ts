"use server";

import { redirect } from "next/navigation";
import { authenticate, resendConfirmation, signOut } from "@/features/auth/service";
import type { AuthMode } from "@/features/auth/schemas";
import type { FormState } from "@/features/auth/types";
import { authDestination } from "@/features/auth/redirects";
import { authFormInput } from "@/features/auth/form-input";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function submitAuth(mode: AuthMode, form: FormData): Promise<FormState> {
  const input = authFormInput(mode, form);
  const result = await authenticate(mode, input, createServerSupabaseClient);
  if (result.destination) {
    redirect(mode === "sign-in" ? authDestination(form.get("next")) : result.destination);
  }
  return result;
}

export async function signInAction(_previous: FormState, form: FormData) { return submitAuth("sign-in", form); }
export async function signUpAction(_previous: FormState, form: FormData) { return submitAuth("sign-up", form); }
export async function recoveryAction(_previous: FormState, form: FormData) { return submitAuth("recovery", form); }
export async function passwordAction(_previous: FormState, form: FormData) { return submitAuth("password", form); }
export async function resendConfirmationAction(_previous: FormState, form: FormData) {
  return resendConfirmation({ email: form.get("email") }, createServerSupabaseClient);
}
export async function signOutAction(): Promise<FormState> {
  const result = await signOut(createServerSupabaseClient);
  if (result.status === "success") redirect("/sign-in?message=signedOut");
  return result;
}
