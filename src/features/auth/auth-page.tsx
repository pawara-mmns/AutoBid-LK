import { AuthForm } from "@/features/auth/auth-form";
import { FormFeedback } from "@/features/auth/form-feedback";
import type { AuthMode } from "@/features/auth/schemas";
import { authDestination } from "@/features/auth/redirects";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getValidatedUser } from "@/features/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDictionary } from "@/i18n/get-dictionary";
import { getSupabaseConfig } from "@/lib/supabase/config";

export type AuthSearchParams = Promise<{ message?: string | string[]; next?: string | string[] }>;
export async function AuthPage({ mode, searchParams }: { mode: AuthMode; searchParams?: AuthSearchParams }) {
  const copy = getDictionary().auth;
  const params = searchParams ? await searchParams : {};
  const next = authDestination(params.next);
  if (mode !== "password" && params.message !== "invalidLink") {
    const client = await createServerSupabaseClient();
    if (client && await getValidatedUser(client)) redirect(next);
  }
  const titles = { "sign-in": copy.signInTitle, "sign-up": copy.signUpTitle, recovery: copy.recoveryTitle, password: copy.passwordTitle };
  const descriptions = { "sign-in": copy.signInDescription, "sign-up": copy.signUpDescription, recovery: copy.recoveryDescription, password: copy.passwordDescription };
  const messages = ["invalidLink", "passwordChanged", "signedOut", "sessionRequired"] as const;
  const message = messages.find((key) => key === params.message);
  return <section className="mx-auto w-full max-w-lg px-5 py-8 sm:px-10 sm:py-12">
    <h1 className="text-3xl font-semibold tracking-tight">{titles[mode]}</h1>
    <p className="mt-3 text-muted-foreground">{descriptions[mode]}</p>
    {message && <div className="mt-6"><FormFeedback state={{ status: message === "signedOut" || message === "passwordChanged" ? "success" : "error", message }} /></div>}
    <AuthForm mode={mode} available={!!getSupabaseConfig()} next={next} />
    {mode !== "password" && <Link href="/vehicles" className="mt-5 flex min-h-11 items-center justify-center rounded-sm text-center text-ui text-muted-foreground underline underline-offset-4">{copy.browseWithoutAccount}</Link>}
  </section>;
}
