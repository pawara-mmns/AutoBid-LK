import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticate, resendConfirmation, signOut } from "@/features/auth/service";
import { accountPermissions, getValidatedUser, hasAdminGrant } from "@/features/auth/authorization";
import { confirmAuthLink } from "@/features/auth/confirmation";
import { authDestination, authLink } from "@/features/auth/redirects";
import { saveOwnProfile } from "@/features/profiles/service";
import type { AppSupabaseClient } from "@/features/auth/types";

const user: User = { id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", created_at: "2026-10-09T00:00:00Z", email: "test@example.invalid", email_confirmed_at: "2026-10-09T00:00:00Z", user_metadata: { role: "admin" }, app_metadata: {} };
const auth = {
  getUser: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn(), resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(), signOut: vi.fn(), exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn(),
  resend: vi.fn(),
};
const query = { select: vi.fn(), update: vi.fn(), insert: vi.fn(), eq: vi.fn(), single: vi.fn(), maybeSingle: vi.fn() };
const from = vi.fn();
const client = { auth, from } as unknown as AppSupabaseClient;
const factory = vi.fn(async () => client);

beforeEach(() => {
  vi.resetAllMocks();
  factory.mockResolvedValue(client);
  auth.getUser.mockResolvedValue({ data: { user }, error: null });
  for (const method of [auth.signInWithPassword, auth.signUp, auth.resetPasswordForEmail, auth.updateUser, auth.signOut, auth.exchangeCodeForSession, auth.verifyOtp, auth.resend]) method.mockResolvedValue({ data: {}, error: null });
  from.mockReturnValue(query);
  for (const method of [query.select, query.update, query.eq]) method.mockReturnValue(query);
  query.single.mockResolvedValue({ data: { id: user.id }, error: null });
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  query.insert.mockResolvedValue({ error: null });
});

describe("authentication service", () => {
  it("fails safely without configuration", async () => {
    expect(await authenticate("sign-in", { email: user.email, password: "test-password" }, async () => null)).toMatchObject({ status: "error", message: "unavailable" });
  });
  it("validates inputs before provider calls", async () => {
    expect(await authenticate("sign-up", { email: "bad", password: "short", displayName: "x" }, factory)).toMatchObject({ status: "error", message: "invalidInput" });
    expect(factory).not.toHaveBeenCalled();
  });
  it("signs in with only validated credentials", async () => {
    expect(await authenticate("sign-in", { email: user.email, password: "test-password" }, factory)).toMatchObject({ destination: "/account" });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: user.email, password: "test-password" });
  });
  it("keeps provider error details private", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { message: "test-sensitive-provider-detail", status: 400 } });
    expect(await authenticate("sign-in", { email: user.email, password: "test-password" }, factory)).toEqual({ status: "error", message: "signInFailed" });
  });
  it("maps provider throttling to understandable feedback", async () => {
    auth.signUp.mockResolvedValue({ error: { status: 429 } });
    expect(await authenticate("sign-up", { email: user.email, password: "long-test-password", displayName: "Test user" }, factory)).toMatchObject({ message: "rateLimited" });
  });
  it("does not send privileged role metadata during signup", async () => {
    await authenticate("sign-up", { email: user.email, password: "long-test-password", displayName: "Test user" }, factory);
    expect(auth.signUp.mock.calls[0]?.[0].options.data).toEqual({ display_name: "Test user" });
    const result = await authenticate("sign-up", { email: user.email, password: "long-test-password", displayName: "Test user", role: "admin" }, factory);
    expect(result.status).toBe("error");
  });
  it("provides non-enumerating recovery feedback and a trusted callback", async () => {
    expect(await authenticate("recovery", { email: user.email }, factory)).toMatchObject({ message: "recoverySent" });
    expect(auth.resetPasswordForEmail.mock.calls[0]?.[1].redirectTo).toBe("http://localhost:3000/auth/callback?next=/account/password");
  });
  it("denies password updates for expired sessions", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: "expired" } });
    expect(await authenticate("password", { password: "long-test-password", confirmPassword: "long-test-password" }, factory)).toMatchObject({ message: "sessionRequired" });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("requires matching passwords and signs out after changing one", async () => {
    expect((await authenticate("password", { password: "long-test-password", confirmPassword: "mismatch" }, factory)).fields).toContain("confirmPassword");
    expect(await authenticate("password", { password: "long-test-password", confirmPassword: "long-test-password" }, factory)).toMatchObject({ destination: "/sign-in?message=passwordChanged" });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "long-test-password" });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("does not claim success when sign-out fails", async () => {
    auth.signOut.mockResolvedValue({ error: { message: "provider failure" } });
    expect(await signOut(factory)).toEqual({ status: "error", message: "signOutFailed" });
  });
  it("resends only signup confirmation with validated input and trusted origin", async () => {
    expect(await resendConfirmation({ email: "bad", type: "invite" }, factory)).toMatchObject({ status: "error" });
    expect(factory).not.toHaveBeenCalled();
    expect(await resendConfirmation({ email: user.email }, factory)).toEqual({ status: "success", message: "checkEmail" });
    expect(auth.resend).toHaveBeenCalledWith({ type: "signup", email: user.email, options: { emailRedirectTo: "http://localhost:3000/auth/callback" } });
  });
  it("handles resend throttling, unavailable configuration and private errors", async () => {
    expect(await resendConfirmation({ email: user.email }, async () => null)).toMatchObject({ message: "unavailable" });
    auth.resend.mockResolvedValue({ error: { status: 429, message: "private detail" } });
    expect(await resendConfirmation({ email: user.email }, factory)).toMatchObject({ message: "rateLimited" });
    auth.resend.mockRejectedValue(new Error("private token"));
    expect(await resendConfirmation({ email: user.email }, factory)).toMatchObject({ message: "tryAgain" });
  });
});

describe("authorization and owned profile writes", () => {
  it("requires a server-confirmed, non-anonymous, email-confirmed account", async () => {
    for (const invalid of [{ ...user, email_confirmed_at: undefined }, { ...user, is_anonymous: true }, null]) {
      auth.getUser.mockResolvedValue({ data: { user: invalid }, error: null });
      expect(await getValidatedUser(client)).toBeNull();
    }
    auth.getUser.mockRejectedValue(new Error("Auth offline"));
    expect(await getValidatedUser(client)).toBeNull();
  });
  it("allows buying and selling together; dealer permission requires verified status", () => {
    expect(accountPermissions("pending")).toEqual({ buyer: true, seller: true, dealer: false });
    expect(accountPermissions("verified").dealer).toBe(true);
    expect(accountPermissions("rejected").dealer).toBe(false);
  });
  it("ignores forged metadata and fails closed on missing/error grants", async () => {
    expect(await hasAdminGrant(client, user.id)).toBe(false);
    query.maybeSingle.mockResolvedValue({ data: { user_id: user.id }, error: null });
    expect(await hasAdminGrant(client, user.id)).toBe(true);
    query.maybeSingle.mockResolvedValue({ data: { user_id: "another-user" }, error: null });
    expect(await hasAdminGrant(client, user.id)).toBe(false);
    query.maybeSingle.mockResolvedValue({ data: null, error: { message: "database unavailable" } });
    expect(await hasAdminGrant(client, user.id)).toBe(false);
  });
  it("derives the profile owner from the validated user", async () => {
    expect(await saveOwnProfile({ displayName: "Test name", preferredLocale: "en" }, factory)).toMatchObject({ message: "profileSaved" });
    expect(query.eq).toHaveBeenCalledWith("id", user.id);
    expect(query.update).toHaveBeenCalledWith({ display_name: "Test name", preferred_locale: "en" });
  });
  it("rejects ownership/privilege fields and invalid sessions before writing", async () => {
    expect((await saveOwnProfile({ displayName: "Test name", preferredLocale: "en", id: "another-user", role: "admin" }, factory)).status).toBe("error");
    expect(query.update).not.toHaveBeenCalled();
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await saveOwnProfile({ displayName: "Test name", preferredLocale: "en" }, factory)).message).toBe("sessionRequired");
    expect(from).not.toHaveBeenCalled();
  });
  it("requests dealer status for the validated owner without a verification flag", async () => {
    await saveOwnProfile({ businessName: "Test business" }, factory, true);
    expect(query.insert).toHaveBeenCalledWith({ user_id: user.id, business_name: "Test business" });
  });
});

describe("email links and redirects", () => {
  it("retains only allowed destinations across auth screen links", () => {
    expect(authLink("sign-up", "/admin")).toBe("/sign-up?next=%2Fadmin");
    expect(authLink("forgot-password", "/account/password")).toBe("/forgot-password?next=%2Faccount%2Fpassword");
    expect(authLink("sign-in", "https://evil.invalid")).toBe("/sign-in");
    expect(authLink("sign-in", ["/admin", "/account"])).toBe("/sign-in");
  });
  it.each(["https://evil.invalid", "//evil.invalid", "/\\evil.invalid", "/account?admin=true", "%2f%2fevil.invalid", null])("never redirects to untrusted destinations", (value) => {
    expect(authDestination(value)).toBe("/account");
  });
  it("rejects missing tokens and unsupported OTP types without calling Auth", async () => {
    expect(await confirmAuthLink(new URLSearchParams("token_hash=test&type=invite"), factory, "token")).toBe("/sign-in?message=invalidLink");
    expect(await confirmAuthLink(new URLSearchParams(), factory, "code")).toBe("/sign-in?message=invalidLink");
    expect(factory).not.toHaveBeenCalled();
  });
  it("verifies a recovery token before opening password change", async () => {
    expect(await confirmAuthLink(new URLSearchParams("token_hash=test-only&type=recovery&next=https://evil.invalid"), factory, "token")).toBe("/account/password");
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "test-only", type: "recovery" });
  });
  it("handles expired/replayed tokens and missing config safely", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: { message: "expired token secret" } });
    expect(await confirmAuthLink(new URLSearchParams("code=test-only"), factory, "code")).toBe("/sign-in?message=invalidLink");
    expect(await confirmAuthLink(new URLSearchParams("code=test-only"), async () => null, "code")).toBe("/sign-in?message=unavailable");
  });
});
