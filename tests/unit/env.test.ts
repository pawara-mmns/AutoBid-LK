import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "@/lib/env";

describe("public environment", () => {
  it("starts locally without credentials", () => {
    expect(parsePublicEnv({}).NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });
  it("accepts an HTTPS origin", () => {
    expect(parsePublicEnv({ NEXT_PUBLIC_SITE_URL: "https://example.com" }).NEXT_PUBLIC_SITE_URL).toBe("https://example.com");
  });
  it.each(["", "not-a-url", "javascript:alert(1)", "https://user:secret@example.com"])("rejects invalid or credential-bearing URLs without leaking them: %s", (value) => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SITE_URL: value })).toThrow("Invalid NEXT_PUBLIC_SITE_URL. Use an HTTP(S) URL without credentials.");
  });
  it("does not return unexpected secret fields", () => {
    const input = { NEXT_PUBLIC_SITE_URL: "https://example.com", SUPABASE_SECRET_KEY: "test-only" };
    expect(parsePublicEnv(input)).not.toHaveProperty("SUPABASE_SECRET_KEY");
  });
});
