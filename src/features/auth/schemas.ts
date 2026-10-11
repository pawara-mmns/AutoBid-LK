import { z } from "zod";

const email = z.string().trim().max(254).pipe(z.email());
// Do not trim passwords: whitespace may be intentional.
const password = z.string().min(12).max(128);
export const signInSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const signUpSchema = z.object({
  email, password,
  displayName: z.string().trim().max(80).refine((value) => value.length === 0 || value.length >= 2),
}).strict();
export const recoverySchema = z.object({ email }).strict();
export const passwordSchema = z.object({ password, confirmPassword: z.string() }).strict()
  .refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"] });

export type AuthMode = "sign-in" | "sign-up" | "recovery" | "password";
export const authSchemas = { "sign-in": signInSchema, "sign-up": signUpSchema, recovery: recoverySchema, password: passwordSchema };
