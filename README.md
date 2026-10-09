# AutoBid LK

A Sri Lanka-first vehicle auction and buying marketplace, developed incrementally. Phase 0 supplies the responsive foundation; Phase 1 supplies authentication/private profiles; Phase 2 adds public vehicle discovery, URL filters, pagination, details and approved photos. Seller submission, admin review, bidding, purchase workflows and payments are not implemented. **This is not a launched or production-ready marketplace.**

Phase 2 source and isolated checks are complete. Public Supabase settings now exist in the ignored local environment, but read-only REST checks returned PGRST205 for the known foundation/marketplace tables. No migrations were applied to that project. Actual Supabase Auth, PostgREST and Storage acceptance remains pending; the app shows friendly unavailable feedback when the schema cannot be queried. Test fixtures are never presented by a normal build.

## Local application setup

Use Node.js 24 LTS and npm. The supported range is Node 22.14 through 24. Exact package versions and the lockfile provide repeatable installation.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. On restricted Windows PowerShell, use `npm.cmd` instead of `npm`; changing the machine execution policy is unnecessary.

The public homepage and information routes work without login or credentials. Browse/details show safe unavailable states when configuration or the database is missing. Account forms require configuration; private account/admin routes never render private content without a valid, confirmed session.

## Supabase configuration

Copy `.env.example` to ignored `.env.local` and fill in:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Use a development project's URL and publishable key, or the local CLI URL and legacy anon key. No service-role/secret key is needed by the application. NEXT_PUBLIC_* values are browser-accessible, including at build time; never put elevated credentials there. Missing/partial/unsafe Supabase configuration disables account operations. Invalid site origins fail with sanitized feedback. Configure HTTPS for deployed origins; secure cookie settings follow this origin.

The schema is in supabase/migrations/ and local settings are in supabase/config.toml. Install the [official CLI and local runtime](https://supabase.com/docs/guides/local-development/cli/getting-started), then use `supabase start` for a fresh local stack. An existing local stack can apply pending SQL using `supabase migration up --local`. No reset, remote migration or live database operation was executed by this phase. See DATABASE.md before provisioning admin membership.

Enable email confirmations, disable anonymous sign-ins and use a minimum 12-character password. The local config includes these settings. Set the provider's Site URL to the same trusted origin as NEXT_PUBLIC_SITE_URL, with these exact callback redirects (replace the origin for deployment):

- http://localhost:3000/auth/callback
- http://localhost:3000/auth/callback?next=/account/password

Local confirmation/recovery templates are supplied in supabase/templates/. For hosted development, copy their corresponding bodies to the provider's email templates after configuration authorization. They use SiteURL + /auth/confirm with TokenHash and email/recovery types; these links also work without a same-browser PKCE verifier. The default PKCE callback route is supported too. Configure and test SMTP/provider delivery and Auth rate limits before release. See [official password auth guidance](https://supabase.com/docs/guides/auth/passwords).

## Available routes

| Route | Access |
| --- | --- |
| / | Public, dynamic homepage with up to six eligible recent vehicles |
| /vehicles | Public; validated URL search/filters, four sorts, 12 vehicles per page |
| /vehicles/[slug] | Public approved listing details; hidden/unknown/invalid identifiers return 404 |
| /vehicle-images/[listingId]/[photoId] | Controlled approved raster photo delivery from private Storage |
| /about, /contact, /help, /terms, /privacy | Functioning pre-release information pages; policies need release review |
| /sell | Explanation of future selling steps; no submission workflow |
| /sign-up, /sign-in, /forgot-password | Public forms; unavailable safely without configuration |
| /auth/confirm, /auth/callback | Email-token or PKCE-code verification; fixed safe redirects |
| /account | Confirmed authenticated account; private own profile and dealer request |
| /account/password | Confirmed authenticated account; matching password update |
| /admin | Confirmed account with a current database admin grant; access entry only |

One account can buy and sell. A submitted dealer business name stays pending. Users cannot set admin membership or dealer verification. Sign-out is scoped to the current device. Full Sinhala/Tamil, PWA, seller management and auctions remain future phases.

Only used passenger cars are supported; other categories are visibly unavailable. Prices are explicitly seller asking prices in exact LKR cents. Condition/history is seller-declared; approval for display is not an inspection claim. The two migrations create private account foundations and the minimum public read model, media and private photo bucket. See [Database](docs/DATABASE.md) for visibility, relationships, limits and photo cache behavior.

## Verification

```sh
npm run check
npm run db:types:check
npm run test:db
npx playwright install chromium
npm run test:e2e
npm run build
```

`check` runs lint, strict types and all Vitest tests. `test:db` runs the SQL/RLS suite alone. `db:types` regenerates migration-derived database types; check drift afterward.

`test:e2e` runs two production suites at http://127.0.0.1:3100: deliberately unconfigured, then a test-only loopback REST/Storage adapter backed by PGlite executing the actual migrations/RLS. It checks discovery, filters, pagination, gallery/visibility, 360px mobile, 768px tablet and desktop layouts alongside guest Auth regressions. Keep port 3100 free. It changes child-process settings only, leaves environment files untouched, stops its servers and restores the normal configured build in a finally block. A forcibly interrupted runner may require `npm run build` manually. It does not test successful provider-backed signup/login/recovery.

If bundled Chromium is unavailable and Google Chrome is installed, set PLAYWRIGHT_CHANNEL=chrome (PowerShell: `$env:PLAYWRIGHT_CHANNEL='chrome'; npm.cmd run test:e2e`). This uses isolated contexts, not your personal browser profile.

PGlite tests execute real PostgreSQL using synthetic Auth/Storage schemas. Browser fixture transport simulates only the REST/Storage operations used here; it is not actual PostgREST/Storage/GoTrue/SMTP hosting. Seeds under tests/fixtures are explicitly test-only, never migrations or application fallbacks. Provider interactions in unit tests are mocked. PHASE_LOG.md distinguishes those boundaries.

## Remaining configured-Supabase acceptance checks

After approved local/development configuration:

1. Review and apply both migrations to an authorized disposable local/development Supabase database; verify schema, grants, facets RPC and private vehicle-photos bucket with actual provider APIs.
2. Create synthetic test accounts through /sign-up. Confirm an email, sign in, save own details, sign out and check expired/revoked sessions.
3. Request password recovery, consume its email link, save a new password and verify the old password no longer signs in. Replay/expire links and confirm safe failure.
4. Confirm account A cannot read/write account B; metadata edits cannot create admin grants; dealer requests cannot self-verify.
5. Separately authorize/provision/revoke a test admin grant and confirm /admin observes both changes. Check refresh cookies across multiple requests and absence of public caching.
6. Using separately authorized synthetic listings/photos, verify only approved, already published rows/photos appear in home, filters and details; draft/rejected/removed/future rows stay hidden. Confirm public/customer writes and private-profile access are denied. Revoke approval and verify raw photo delivery immediately denies access; account for the optimized image cache described in DATABASE.md.

These checks are pending, not reported as passed.

## Production/deployment guidance

Target Vercel's Next.js preset and Node 24 with npm ci/build. No deployment was performed. Public settings are fixed at build time; use the correct HTTPS site origin, project URL and publishable key. Finish configured Auth verification and later security/localization/performance/release gates before launch. Keep the foundation's noindex setting until approved release readiness.

Read [AGENTS.md](AGENTS.md), [Architecture](docs/ARCHITECTURE.md), [Database](docs/DATABASE.md), [Roadmap](docs/ROADMAP.md), [Phase log](docs/PHASE_LOG.md) and [Decisions](docs/DECISIONS.md).

The phase log records development-only lint dependency advisories and this environment's Git ownership issue. If Git reports dubious ownership, `git -c safe.directory=D:/Project/AutoBid-LK status` gives a scoped inspection; an authorized administrator should correct ownership for normal use. No global Git trust setting was changed.
