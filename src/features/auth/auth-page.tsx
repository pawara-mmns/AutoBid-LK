import { AuthForm } from "@/features/auth/auth-form";
import { FormFeedback } from "@/features/auth/form-feedback";
import type { AuthMode } from "@/features/auth/schemas";
import { authDestination } from "@/features/auth/redirects";
import { getDictionary } from "@/i18n/get-dictionary";
import { getSupabaseConfig } from "@/lib/supabase/config";

type SearchParams = Promise<{ message?: string; next?: string }>;
export async function AuthPage({ mode, searchParams }: { mode: AuthMode; searchParams?: SearchParams }) {
  const copy = getDictionary().auth;
  const params = searchParams ? await searchParams : {};
  const titles = { "sign-in": copy.signInTitle, "sign-up": copy.signUpTitle, recovery: copy.recoveryTitle, password: copy.passwordTitle };
  const descriptions = { "sign-in": copy.signInDescription, "sign-up": copy.signUpDescription, recovery: copy.recoveryDescription, password: copy.passwordDescription };
  const messages = ["invalidLink", "passwordChanged", "signedOut", "sessionRequired"] as const;
  const message = messages.find((key) => key === params.message);
  return <section className="mx-auto max-w-md px-5 py-12 sm:py-16">
    <p className="text-sm font-semibold text-primary">{copy.eyebrow}</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight">{titles[mode]}</h1>
    <p className="mt-4 text-muted-foreground">{descriptions[mode]}</p>
    {message && <div className="mt-6"><FormFeedback state={{ status: message === "signedOut" || message === "passwordChanged" ? "success" : "error", message }} /></div>}
    <AuthForm mode={mode} available={!!getSupabaseConfig()} next={authDestination(params.next)} />
  </section>;
}
