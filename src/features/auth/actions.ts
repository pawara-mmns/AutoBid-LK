"use server";

import { redirect } from "next/navigation";
import { authenticate, signOut } from "@/features/auth/service";
import type { AuthMode } from "@/features/auth/schemas";
import type { FormState } from "@/features/auth/types";
import { authDestination } from "@/features/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function submitAuth(mode: AuthMode, form: FormData): Promise<FormState> {
  const fields = {
    "sign-in": ["email", "password"], "sign-up": ["email", "password", "displayName"],
    recovery: ["email"], password: ["password", "confirmPassword"],
  }[mode];
  const input = Object.fromEntries(fields.map((key) => [key, form.get(key)]));
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
export async function signOutAction(): Promise<FormState> {
  const result = await signOut(createServerSupabaseClient);
  if (result.status === "success") redirect("/sign-in?message=signedOut");
  return result;
}
