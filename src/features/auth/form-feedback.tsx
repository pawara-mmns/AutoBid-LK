import type { FormState } from "@/features/auth/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function FormFeedback({ state }: { state: FormState }) {
  if (!state.message) return null;
  return <p role={state.status === "error" ? "alert" : "status"}
    className="rounded-md border border-border bg-muted p-4 text-sm">
    {getDictionary().auth.messages[state.message]}
  </p>;
}
