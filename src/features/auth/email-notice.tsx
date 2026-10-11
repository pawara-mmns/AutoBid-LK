"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { recoveryAction, resendConfirmationAction } from "@/features/auth/actions";
import { FormFeedback } from "@/features/auth/form-feedback";
import type { FormState } from "@/features/auth/types";
import { authLink } from "@/features/auth/redirects";
import { getDictionary } from "@/i18n/get-dictionary";

export function EmailNotice({ email, recovery, next, onChangeEmail }: { email: string; recovery: boolean; next: string; onChangeEmail: () => void }) {
  const [seconds, setSeconds] = useState(60);
  const readyAt = useRef(0);
  const coolingDown = seconds > 0;
  const submitting = useRef(false);
  const [state, action, pending] = useActionState(async (previous: FormState, form: FormData) => {
    try {
      const result = await (recovery ? recoveryAction : resendConfirmationAction)(previous, form);
      readyAt.current = Date.now() + 60_000;
      setSeconds(60);
      return result;
    } finally { submitting.current = false; }
  }, { status: "idle" } as FormState);
  useEffect(() => {
    if (!coolingDown) return;
    if (!readyAt.current) readyAt.current = Date.now() + 60_000;
    const interval = setInterval(() => setSeconds(Math.max(0, Math.ceil((readyAt.current - Date.now()) / 1000))), 1000);
    return () => clearInterval(interval);
  }, [coolingDown]);
  const copy = getDictionary().auth;
  return <section className="mt-7" aria-labelledby="email-notice-title">
    <div role="status"><h2 id="email-notice-title" className="text-section font-semibold">{copy.checkEmailTitle}</h2>
      <p className="mt-3 break-all font-medium">{email}</p><p className="mt-3 text-muted-foreground">{recovery ? copy.messages.recoverySent : copy.messages.checkEmail}</p>
    </div>
    <p className="mt-4 text-ui text-muted-foreground">{copy.emailHelp}</p>
    <form action={action} className="mt-5 space-y-3" onSubmit={(event) => {
      if (seconds || submitting.current) event.preventDefault();
      else submitting.current = true;
    }}>
      <input type="hidden" name="email" value={email} />
      <FormFeedback state={state} />
      <Button type="submit" variant="outline" className="w-full" disabled={seconds > 0 || pending} aria-busy={pending}>{pending ? copy.pending : seconds ? copy.resendWait.replace("{seconds}", String(seconds)) : copy.resendEmail}</Button>
    </form>
    <Button variant="ghost" className="mt-3 w-full" onClick={onChangeEmail}>{copy.changeEmail}</Button>
    <Link href={authLink("sign-in", next)} className="mt-3 flex min-h-11 items-center justify-center rounded-sm text-ui font-medium text-primary underline underline-offset-4">{copy.returnToSignIn}</Link>
  </section>;
}
