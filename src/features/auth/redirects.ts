// Allowlist destinations instead of trying to sanitize arbitrary redirect URLs.
export function authDestination(value: unknown): string {
  if (typeof value === "string" && (value === "/account/password" || value === "/admin" || value === "/seller/vehicles" || value === "/seller/vehicles/new" || /^\/seller\/vehicles\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value))) return value;
  return "/account";
}

export function authLink(route: "sign-in" | "sign-up" | "forgot-password", destination: unknown) {
  const next = authDestination(destination);
  return `/${route}${next === "/account" ? "" : `?next=${encodeURIComponent(next)}`}`;
}
