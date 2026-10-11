import type { FormState } from "@/features/auth/types";
import { getDictionary } from "@/i18n/get-dictionary";

export function FormFeedback({ state }: { state: FormState }) {
  if (!state.message) return null;
  return <p role={state.status === "error" ? "alert" : "status"}
    className={`border-s-2 px-4 py-3 text-ui ${state.status === "error" ? "border-danger bg-muted" : "border-primary bg-muted"}`}>
    {getDictionary().auth.messages[state.message]}
  </p>;
}
