"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { passwordAction, recoveryAction, signInAction, signUpAction } from "@/features/auth/actions";
import { FormFeedback } from "@/features/auth/form-feedback";
import type { AuthMode } from "@/features/auth/schemas";
import type { FormState } from "@/features/auth/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function AuthForm({ mode, available, next = "/account" }: { mode: AuthMode; available: boolean; next?: string }) {
  const actions = { "sign-in": signInAction, "sign-up": signUpAction, recovery: recoveryAction, password: passwordAction };
  const [state, action, pending] = useActionState(actions[mode], { status: "idle" } as FormState);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const copy = getDictionary().auth;
  const label = { "sign-in": copy.signIn, "sign-up": copy.signUp, recovery: copy.sendRecovery, password: copy.savePassword }[mode];
  const invalid = (field: string) => state.fields?.includes(field) ?? false;
  return (
    <form action={action} className="mt-7 space-y-5">
      {!available && <FormFeedback state={{ status: "error", message: "unavailable" }} />}
      <FormFeedback state={state} />
      <input type="hidden" name="next" value={next} />
      <fieldset disabled={!available || pending} className="space-y-5">
        {mode === "sign-up" && <div>
          <label htmlFor="displayName" className="mb-2 block text-sm font-semibold">{copy.displayName}</label>
          <Input id="displayName" name="displayName" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} aria-invalid={invalid("displayName")} aria-describedby="name-hint" />
          <p id="name-hint" className="mt-2 text-sm text-muted-foreground">{invalid("displayName") ? copy.messages.fieldInvalid : copy.nameHint}</p>
        </div>}
        {mode !== "password" && <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold">{copy.email}</label>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)}
            aria-invalid={invalid("email")} aria-describedby={invalid("email") ? "email-error" : undefined} />
          {invalid("email") && <p id="email-error" className="mt-2 text-sm text-muted-foreground">{copy.messages.fieldInvalid}</p>}
        </div>}
        {mode !== "recovery" && <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold">{mode === "password" ? copy.newPassword : copy.password}</label>
          <Input id="password" name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} required
            minLength={mode === "sign-in" ? 1 : 12} maxLength={128} aria-invalid={invalid("password")} aria-describedby="password-hint" />
          <p id="password-hint" className="mt-2 text-sm text-muted-foreground">{invalid("password") ? copy.messages.fieldInvalid : mode !== "sign-in" ? copy.passwordHint : ""}</p>
        </div>}
        {mode === "password" && <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold">{copy.confirmPassword}</label>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required maxLength={128}
            aria-invalid={invalid("confirmPassword")} aria-describedby={invalid("confirmPassword") ? "confirm-error" : undefined} />
          {invalid("confirmPassword") && <p id="confirm-error" className="mt-2 text-sm text-muted-foreground">{copy.messages.fieldInvalid}</p>}
        </div>}
      </fieldset>
      <Button type="submit" disabled={!available || pending} className="w-full" aria-busy={pending}>{pending ? copy.pending : label}</Button>
      <div className="flex flex-col items-center gap-1 text-sm">
        {mode === "sign-in" ? <>
          <Link href="/forgot-password" className="flex min-h-11 items-center rounded-sm text-primary underline underline-offset-4">{copy.forgotPassword}</Link>
          <Link href="/sign-up" className="flex min-h-11 items-center rounded-sm text-primary underline underline-offset-4">{copy.newAccount}</Link>
        </> : <Link href="/sign-in" className="flex min-h-11 items-center rounded-sm text-primary underline underline-offset-4">
          {mode === "sign-up" ? copy.existingAccount : copy.returnToSignIn}
        </Link>}
      </div>
    </form>
  );
}
