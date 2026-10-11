"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormFeedback } from "@/features/auth/form-feedback";
import type { FormState } from "@/features/auth/types";
import { saveProfileAction, requestDealerAction } from "@/features/profiles/actions";
import { getDictionary } from "@/i18n/get-dictionary";

export function ProfileForm({ displayName, preferredLocale }: { displayName: string | null; preferredLocale: string }) {
  const [state, action, pending] = useActionState(saveProfileAction, { status: "idle" } as FormState);
  const [name, setName] = useState(displayName ?? "");
  const { account: copy, auth } = getDictionary();
  return <form action={action} className="mt-6 space-y-4">
    <FormFeedback state={state} />
    <label htmlFor="displayName" className="block text-sm font-semibold">{copy.name}</label>
    <Input id="displayName" name="displayName" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} disabled={pending}
      aria-invalid={state.fields?.includes("displayName") ?? false} aria-describedby="profile-name-hint" />
    <p id="profile-name-hint" className={`text-ui ${state.fields?.includes("displayName") ? "text-danger" : "text-muted-foreground"}`}>{auth.nameHint}</p>
    <input type="hidden" name="preferredLocale" value={preferredLocale} />
    <p className="text-sm text-muted-foreground">{copy.languageNote}</p>
    <Button type="submit" disabled={pending} aria-busy={pending} className="w-full sm:w-auto">{pending ? auth.pending : copy.save}</Button>
  </form>;
}

export function DealerRequestForm() {
  const [state, action, pending] = useActionState(requestDealerAction, { status: "idle" } as FormState);
  const [businessName, setBusinessName] = useState("");
  const { account: copy, auth } = getDictionary();
  return <form action={action} className="mt-5 space-y-4">
    <FormFeedback state={state} />
    <label htmlFor="businessName" className="block text-sm font-semibold">{copy.businessName}</label>
    <Input id="businessName" name="businessName" required minLength={2} maxLength={120} autoComplete="organization" value={businessName} onChange={(event) => setBusinessName(event.target.value)} disabled={pending}
      aria-invalid={state.fields?.includes("businessName") ?? false} aria-describedby="business-hint" />
    <p id="business-hint" className="text-sm text-muted-foreground">{copy.businessHint}</p>
    <Button type="submit" disabled={pending} aria-busy={pending} className="w-full sm:w-auto">{pending ? auth.pending : copy.requestDealer}</Button>
  </form>;
}
