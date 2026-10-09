import { describe, expect, it } from "vitest";
import { parseSupabaseConfig } from "@/lib/supabase/config";

const valid = { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_fixture_only" };
const jwt = (role: string) => `test.${btoa(JSON.stringify({ role }))}.test`;

describe("Supabase public configuration", () => {
  it.each([{}, { NEXT_PUBLIC_SUPABASE_URL: valid.NEXT_PUBLIC_SUPABASE_URL }, { ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" }])("safely disables auth for missing configuration", (input) => {
    expect(parseSupabaseConfig(input)).toBeNull();
  });
  it("accepts publishable and local anon keys", () => {
    expect(parseSupabaseConfig(valid)).toEqual({ url: valid.NEXT_PUBLIC_SUPABASE_URL, key: valid.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY });
    expect(parseSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt("anon") })).not.toBeNull();
  });
  it.each(["sb_secret_never_public", jwt("service_role"), "invalid"])("rejects elevated or invalid public keys", (key) => {
    expect(parseSupabaseConfig({ ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key })).toBeNull();
  });
  it.each(["javascript:alert(1)", "http://example.com", "https://user:secret@example.com", "https://example.com?key=secret", "bad-url"])("rejects unsafe URLs without exposing input", (url) => {
    expect(parseSupabaseConfig({ ...valid, NEXT_PUBLIC_SUPABASE_URL: url })).toBeNull();
  });
});
