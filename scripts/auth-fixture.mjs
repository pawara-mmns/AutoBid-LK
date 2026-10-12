// Test-only Auth/profile transport, not GoTrue, SMTP or a production authentication service.
// Only started explicitly by QA/E2E; no src/ imports, environment files or real users.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { startMarketplaceFixture } from "./marketplace-fixture.mjs";

export async function startAuthFixture({ seller = false, admin = false } = {}) {
  const marketplace = await startMarketplaceFixture();
  const sellerFixture = seller ? await (await import("./seller-fixture.mjs")).createSellerFixture({ admin }) : null;
  const identities = new Map();
  const sessions = new Map();
  const profiles = new Map();
  const requests = [];
  const user = (email) => { if (seller && !identities.has(email)) identities.set(email, randomUUID()); return ({ id: seller ? identities.get(email) : "00000000-0000-4000-8000-000000000001", email,
    aud: "authenticated", role: "authenticated", created_at: "2026-10-09T00:00:00Z",
    email_confirmed_at: "2026-10-09T00:00:00Z", app_metadata: { provider: "email" },
    user_metadata: { role: "admin" }, identities: [] }); };
  const session = (account) => {
    const now = Math.floor(Date.now() / 1000);
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    // HS256 makes the SDK validate this synthetic session with the test /user endpoint.
    const access_token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: account.id, aud: "authenticated", exp: now + 3600, iat: now, role: "authenticated" })}.test-only`;
    const refresh_token = randomUUID();
    sessions.set(access_token, account);
    sessions.set(refresh_token, account);
    if (!profiles.has(account.id)) profiles.set(account.id, { id: account.id, display_name: "Test account", preferred_locale: "en" });
    return { access_token, refresh_token, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, user: account };
  };
  const server = createServer(async (request, response) => {
    const json = (data, status = 200) => { response.writeHead(status, { "Content-Type": "application/json" }); response.end(JSON.stringify(data)); };
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      const account = sessions.get(request.headers.authorization?.replace(/^Bearer /, ""));
      if (url.pathname.startsWith("/auth/v1/")) {
        let raw = "";
        for await (const chunk of request) raw += chunk;
        const body = raw ? JSON.parse(raw) : {};
        // Record operation names only. Never retain credentials, tokens or reset links.
        requests.push(`${request.method} ${url.pathname}`);
        if (body.email?.startsWith("slow@")) await new Promise((resolve) => setTimeout(resolve, 800));
        if (body.email?.startsWith("limited@")) return json({ msg: "Test-only throttling", code: "over_email_send_rate_limit" }, 429);
        if (url.pathname === "/auth/v1/token") {
          if (url.searchParams.get("grant_type") === "refresh_token") {
            const refreshed = sessions.get(body.refresh_token);
            return refreshed ? json(session(refreshed)) : json({ msg: "Test-only expired", code: "refresh_token_not_found" }, 400);
          }
          if (body.email?.startsWith("wrong@")) return json({ msg: "Test-only invalid credentials", code: "invalid_credentials" }, 400);
          return json(session(user(body.email)));
        }
        if (["/auth/v1/signup", "/auth/v1/resend", "/auth/v1/recover"].includes(url.pathname)) {
          if (url.pathname.endsWith("signup")) return json({ ...user(body.email), email_confirmed_at: null, identities: [] });
          return json({});
        }
        if (url.pathname === "/auth/v1/user") {
          if (!account) return json({ msg: "Test-only expired", code: "session_not_found" }, 401);
          return json(account);
        }
        if (url.pathname === "/auth/v1/logout") return json({});
        if (url.pathname === "/auth/v1/verify") {
          if (body.token_hash !== "test-only-valid") return json({ msg: "Test-only invalid link", code: "otp_expired" }, 403);
          return json(session(user("confirmed@example.invalid")));
        }
        return json({ msg: "Test-only unsupported Auth operation" }, 404);
      }
      if (admin && sellerFixture && request.method === 'GET' && ['/rest/v1/profiles','/rest/v1/admin_grants'].includes(url.pathname) && await sellerFixture.handle(request,response,account)) return;
      if (["/rest/v1/profiles", "/rest/v1/dealer_profiles", "/rest/v1/admin_grants"].includes(url.pathname)) {
        if (!account) return json({ message: "Test-only unauthenticated" }, 401);
        if (url.pathname.endsWith("admin_grants") || url.pathname.endsWith("dealer_profiles")) {
          if (request.method !== "GET") return json({ message: "Test-only unavailable write" }, 403);
          return json(null);
        }
        if (url.searchParams.get("id") !== `eq.${account.id}`) return json(null);
        if (request.method === "PATCH") {
          let raw = "";
          for await (const chunk of request) raw += chunk;
          const body = JSON.parse(raw);
          profiles.set(account.id, { ...profiles.get(account.id), display_name: body.display_name, preferred_locale: body.preferred_locale });
          return json({ id: account.id });
        }
        return json(profiles.get(account.id));
      }
      if (sellerFixture && await sellerFixture.handle(request, response, account)) return;
      const upstream = await fetch(`${marketplace.url}${request.url}`, { headers: { apikey: "sb_publishable_autobid_fixture_only" } });
      response.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") ?? "application/json", ...(upstream.headers.has("content-range") ? { "Content-Range": upstream.headers.get("content-range") } : {}) });
      response.end(Buffer.from(await upstream.arrayBuffer()));
    } catch { json({ message: "Test-only transport failure" }, 500); }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  return { url: `http://127.0.0.1:${server.address().port}`, requests,
    async close() { await new Promise((resolve) => server.close(resolve)); await marketplace.close(); await sellerFixture?.close(); } };
}
