// Allowlist destinations instead of trying to sanitize arbitrary redirect URLs.
export function authDestination(value: unknown): "/account" | "/account/password" | "/admin" {
  return value === "/account/password" || value === "/admin" ? value : "/account";
}
