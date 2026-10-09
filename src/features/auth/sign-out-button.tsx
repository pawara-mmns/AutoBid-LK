"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { FormFeedback } from "@/features/auth/form-feedback";
import type { FormState } from "@/features/auth/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function SignOutButton() {
  const [state, action, pending] = useActionState(signOutAction, { status: "idle" } as FormState);
  const copy = getDictionary().auth;
  return <form action={action} className="space-y-3">
    <FormFeedback state={state} />
    <Button type="submit" variant="outline" disabled={pending}>{pending ? copy.pending : copy.signOut}</Button>
  </form>;
}
