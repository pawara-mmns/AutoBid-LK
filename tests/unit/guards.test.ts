import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppSupabaseClient } from "@/features/auth/types";
import { requireAdmin, requireUser } from "@/features/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (destination: string) => { throw new Error(`REDIRECT:${destination}`); } }));

const getUser = vi.fn();
const maybeSingle = vi.fn();
const select = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) }));
const user = { id: "test-owner", email: "test@example.invalid", email_confirmed_at: "2026-10-09", user_metadata: { role: "admin" } };
const client = { auth: { getUser }, from: vi.fn(() => ({ select })) } as unknown as AppSupabaseClient;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createServerSupabaseClient).mockResolvedValue(client);
  getUser.mockResolvedValue({ data: { user }, error: null });
  maybeSingle.mockResolvedValue({ data: null, error: null });
});

describe("server route guards", () => {
  it("redirects safely when configuration is missing", async () => {
    vi.mocked(createServerSupabaseClient).mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("REDIRECT:/sign-in?message=unavailable&next=%2Faccount");
  });
  it("redirects guests and expired/invalid sessions before returning private context", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
    await expect(requireUser("/account/password")).rejects.toThrow("REDIRECT:/sign-in?message=sessionRequired&next=%2Faccount%2Fpassword");
  });
  it("returns context only after provider validation", async () => {
    expect(await requireUser()).toEqual({ client, user });
    expect(getUser).toHaveBeenCalledOnce();
  });
  it("denies admin access despite admin-like user metadata", async () => {
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/account?message=accessDenied");
  });
  it("accepts only a current database grant and observes revocation", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { user_id: user.id }, error: null });
    expect((await requireAdmin()).user.id).toBe(user.id);
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/account?message=accessDenied");
  });
});
