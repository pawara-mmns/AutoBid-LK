"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { passwordAction, recoveryAction, signInAction, signUpAction } from "@/features/auth/actions";
import { FormFeedback } from "@/features/auth/form-feedback";
import { PasswordField } from "@/features/auth/password-field";
import { EmailNotice } from "@/features/auth/email-notice";
import { authSchemas, type AuthMode } from "@/features/auth/schemas";
import { authFormInput } from "@/features/auth/form-input";
import { authLink } from "@/features/auth/redirects";
import type { FormState } from "@/features/auth/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function AuthForm({ mode, available, next = "/account" }: { mode: AuthMode; available: boolean; next?: string }) {
  const actions = { "sign-in": signInAction, "sign-up": signUpAction, recovery: recoveryAction, password: passwordAction };
  const submitting = useRef(false);
  const [state, action, pending] = useActionState(async (previous: FormState, form: FormData) => {
    try {
      const result = await actions[mode](previous, form);
      setEditingEmail(false);
      return result;
    }
    finally { submitting.current = false; }
  }, { status: "idle" } as FormState);
  const [email, setEmail] = useState("");
  const [validation, setValidation] = useState<FormState>({ status: "idle" });
  const [editingEmail, setEditingEmail] = useState(false);
  const copy = getDictionary().auth;
  const label = { "sign-in": copy.signIn, "sign-up": copy.signUp, recovery: copy.sendRecovery, password: copy.savePassword }[mode];
  const feedback = validation.status === "error" ? validation : state;
  const invalid = (field: string) => feedback.fields?.includes(field) ?? false;
  if (state.status === "success" && (mode === "sign-up" || mode === "recovery") && !editingEmail && !pending) {
    return <EmailNotice email={email} recovery={mode === "recovery"} next={next} onChangeEmail={() => setEditingEmail(true)} />;
  }
  return <form action={action} noValidate className="mt-7 space-y-5" onSubmit={(event) => {
    if (!available || submitting.current) { event.preventDefault(); return; }
    const form = new FormData(event.currentTarget);
    const result = authSchemas[mode].safeParse(authFormInput(mode, form));
    if (!result.success) {
      event.preventDefault();
      const invalidFields = [...new Set(result.error.issues.map((issue) => String(issue.path[0] ?? "")))];
      setValidation({ status: "error", message: "invalidInput", fields: invalidFields });
      const field = event.currentTarget.elements.namedItem(invalidFields[0] ?? "");
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    setValidation({ status: "idle" });
    submitting.current = true;
  }}>
    {!available && <FormFeedback state={{ status: "error", message: "unavailable" }} />}
    {(feedback.status !== "success" || !editingEmail) && <FormFeedback state={feedback} />}
    <input type="hidden" name="next" value={next} />
    {mode === "sign-up" && <input type="hidden" name="displayName" value="" />}
    <fieldset disabled={!available || pending} className="space-y-5">
      {mode !== "password" && <div>
        <label htmlFor="email" className="mb-2 block text-ui font-semibold">{copy.email}</label>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required maxLength={254}
          value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={invalid("email")} aria-describedby={invalid("email") ? "email-error" : undefined} />
        {invalid("email") && <p id="email-error" className="mt-2 text-ui text-danger">{copy.emailInvalid}</p>}
      </div>}
      {mode !== "recovery" && <PasswordField key={`password-${state.status}-${state.message ?? ""}`} name="password" label={mode === "password" ? copy.newPassword : copy.password}
        autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={mode === "sign-in" ? 1 : 12} invalid={invalid("password")}
        hint={invalid("password") ? mode === "sign-in" ? copy.signInPasswordInvalid : copy.passwordInvalid : mode !== "sign-in" ? copy.passwordHint : undefined} />}
      {mode === "password" && <PasswordField key={`confirm-${state.status}-${state.message ?? ""}`} name="confirmPassword" label={copy.confirmPassword}
        autoComplete="new-password" invalid={invalid("confirmPassword")} hint={invalid("confirmPassword") ? copy.confirmInvalid : undefined} />}
    </fieldset>
    {mode === "sign-in" && <Link href={authLink("forgot-password", next)} className="flex min-h-11 items-center justify-end rounded-sm text-ui font-medium text-primary underline underline-offset-4">{copy.forgotPassword}</Link>}
    <Button type="submit" disabled={!available || pending} className="w-full" aria-busy={pending}>{pending ? copy.pending : label}</Button>
    <div className="border-t border-border pt-3 text-ui">
      <Link href={mode === "sign-in" ? authLink("sign-up", next) : mode === "password" ? "/account" : authLink("sign-in", next)}
        className="flex min-h-11 items-center justify-center rounded-sm text-center font-medium text-primary underline underline-offset-4">
        {mode === "sign-in" ? copy.newAccount : mode === "sign-up" ? copy.existingAccount : mode === "password" ? copy.backToAccount : copy.returnToSignIn}
      </Link>
    </div>
  </form>;
}
