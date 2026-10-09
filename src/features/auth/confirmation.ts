import "server-only";
import { authDestination } from "@/features/auth/redirects";
import type { ClientFactory } from "@/features/auth/types";

export async function confirmAuthLink(params: URLSearchParams, createClient: ClientFactory, kind: "code" | "token") {
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if ((kind === "code" && !code) || (kind === "token" && (!tokenHash || !["email", "signup", "recovery"].includes(type ?? "")))) {
    return "/sign-in?message=invalidLink";
  }
  const client = await createClient();
  if (!client) return "/sign-in?message=unavailable";
  try {
    const result = kind === "code"
      ? await client.auth.exchangeCodeForSession(code!)
      : await client.auth.verifyOtp({ token_hash: tokenHash!, type: type as "email" | "signup" | "recovery" });
    if (result.error) return "/sign-in?message=invalidLink";
    return type === "recovery" ? "/account/password" : authDestination(params.get("next"));
  } catch { return "/sign-in?message=invalidLink"; }
}
