import "server-only";
import { getValidatedUser } from "@/features/auth/authorization";
import { passwordSchema, recoverySchema, signInSchema, signUpSchema, type AuthMode } from "@/features/auth/schemas";
import type { AuthResult, ClientFactory } from "@/features/auth/types";
import { publicEnv } from "@/lib/env";

export async function authenticate(mode: AuthMode, input: unknown, createClient: ClientFactory): Promise<AuthResult> {
  const schema = { "sign-in": signInSchema, "sign-up": signUpSchema, recovery: recoverySchema, password: passwordSchema }[mode];
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "invalidInput", fields: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "")))] };
  }
  const client = await createClient();
  if (!client) return { status: "error", message: "unavailable" };
  try {
    if (mode === "sign-in") {
      const data = signInSchema.parse(parsed.data);
      const { error } = await client.auth.signInWithPassword(data);
      if (error) return { status: "error", message: error.status === 429 ? "rateLimited" : "signInFailed" };
      return { status: "success", destination: "/account" };
    }
    if (mode === "sign-up") {
      const data = signUpSchema.parse(parsed.data);
      const { error } = await client.auth.signUp({
        email: data.email, password: data.password,
        options: {
          data: { display_name: data.displayName || null },
          emailRedirectTo: new URL("/auth/callback", publicEnv.NEXT_PUBLIC_SITE_URL).toString(),
        },
      });
      if (error) return { status: "error", message: error.status === 429 ? "rateLimited" : "signUpFailed" };
      // Same message for new and existing accounts; no role metadata is sent.
      return { status: "success", message: "checkEmail" };
    }
    if (mode === "recovery") {
      const data = recoverySchema.parse(parsed.data);
      const { error } = await client.auth.resetPasswordForEmail(data.email, {
        redirectTo: new URL("/auth/callback?next=/account/password", publicEnv.NEXT_PUBLIC_SITE_URL).toString(),
      });
      if (error) return { status: "error", message: error.status === 429 ? "rateLimited" : "recoveryFailed" };
      return { status: "success", message: "recoverySent" };
    }
    if (!await getValidatedUser(client)) return { status: "error", message: "sessionRequired" };
    const data = passwordSchema.parse(parsed.data);
    const { error } = await client.auth.updateUser({ password: data.password });
    if (error) return { status: "error", message: "passwordFailed" };
    const { error: signOutError } = await client.auth.signOut({ scope: "local" });
    if (signOutError) return { status: "success", message: "passwordSaved" };
    return { status: "success", destination: "/sign-in?message=passwordChanged" };
  } catch { return { status: "error", message: "tryAgain" }; }
}

export async function signOut(createClient: ClientFactory): Promise<AuthResult> {
  const client = await createClient();
  if (!client) return { status: "error", message: "unavailable" };
  try {
    const { error } = await client.auth.signOut({ scope: "local" });
    return error ? { status: "error", message: "signOutFailed" } : { status: "success" };
  } catch { return { status: "error", message: "tryAgain" }; }
}
