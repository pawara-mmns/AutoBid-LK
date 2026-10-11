// Allowlist destinations instead of trying to sanitize arbitrary redirect URLs.
export function authDestination(value: unknown): "/account" | "/account/password" | "/admin" {
  return value === "/account/password" || value === "/admin" ? value : "/account";
}

export function authLink(route: "sign-in" | "sign-up" | "forgot-password", destination: unknown) {
  const next = authDestination(destination);
  return `/${route}${next === "/account" ? "" : `?next=${encodeURIComponent(next)}`}`;
}
