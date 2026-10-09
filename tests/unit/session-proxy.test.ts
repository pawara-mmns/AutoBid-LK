import { NextRequest } from "next/server";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/proxy";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ getSupabaseConfig: vi.fn(), supabaseCookieOptions: { path: "/", sameSite: "lax", secure: false } }));

beforeEach(() => { vi.resetAllMocks(); });

describe("SSR refresh cookies and caching", () => {
  it("does not contact Supabase when configuration is missing", async () => {
    vi.mocked(getSupabaseConfig).mockReturnValue(null);
    const response = await updateSession(new NextRequest("http://localhost:3000/account"));
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(createServerClient).not.toHaveBeenCalled();
  });
  it("passes refreshed cookies to rendering and the browser, preserving cache headers", async () => {
    vi.mocked(getSupabaseConfig).mockReturnValue({ url: "https://example.supabase.co", key: "test-publishable" });
    vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
      const cookies = options.cookies as CookieMethodsServer;
      return { auth: { getClaims: async () => {
        await cookies.setAll?.([{ name: "test-session", value: "test-token", options: { path: "/", sameSite: "lax", maxAge: 3600 } }], { "Cache-Control": "private, no-cache, no-store", Pragma: "no-cache", Expires: "0" });
        await cookies.setAll?.([{ name: "test-verifier", value: "", options: { path: "/", maxAge: 0 } }], {});
        return { data: null, error: null };
      } } } as unknown as ReturnType<typeof createServerClient>;
    });
    const request = new NextRequest("http://localhost:3000/account");
    const response = await updateSession(request);
    expect(request.cookies.get("test-session")?.value).toBe("test-token");
    expect(response.cookies.get("test-session")?.value).toBe("test-token");
    expect(response.cookies.get("test-verifier")?.maxAge).toBe(0);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-middleware-request-cookie")).toContain("test-verifier=");
  });
});
