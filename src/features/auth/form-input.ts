import type { AuthMode } from "@/features/auth/schemas";

export function authFormInput(mode: AuthMode, form: FormData) {
  const fields = { "sign-in": ["email", "password"], "sign-up": ["email", "password", "displayName"], recovery: ["email"], password: ["password", "confirmPassword"] }[mode];
  return Object.fromEntries(fields.map((key) => [key, form.get(key)]));
}
