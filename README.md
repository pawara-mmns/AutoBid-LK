# AutoBid LK

A Sri Lanka-first vehicle auction and buying marketplace, developed incrementally. Phase 0 supplies the responsive foundation; Phase 1 supplies authentication/private profiles; Phase 2 adds public vehicle discovery, URL filters, pagination, details and approved photos. Stage 5 (development Phase 3) adds private owned seller drafts, photos, pricing, submission for review and My Vehicles. Admin review, publication from seller submissions, bidding, purchase workflows and payments are not implemented. **This is not a launched or production-ready marketplace.**

Phase 2 source and isolated checks are complete. Public Supabase settings exist in the ignored local environment. Earlier read-only REST checks returned PGRST205 for known tables; the latest Stage 1 normal-build captures show an empty approved-listing state. No migrations were applied during this UI work. Actual Supabase Auth, PostgREST and Storage acceptance remains pending; the app shows friendly unavailable feedback when configuration or queries fail. Test fixtures are never presented by a normal build.

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
| /sell | Public seller introduction; sign-in required before creating a private draft |
| /seller/vehicles | Confirmed seller's own vehicles, 25 per page |
| /seller/vehicles/new | Confirmed account; idempotent draft creation |
| /seller/vehicles/[id] | Owned five-step wizard or locked submission details; unrelated/invalid IDs return 404 |
| /seller/vehicles/[id]/photos | Same-origin, authenticated owned draft photo upload/management |
| /seller/vehicles/[id]/photos/[photoId] | Authorized private preview with no-store; unrelated access returns 404 |
| /sign-up, /sign-in, /forgot-password | Public forms; unavailable safely without configuration |
| /auth/confirm, /auth/callback | Email-token or PKCE-code verification; fixed safe redirects |
| /account | Confirmed authenticated account; private own profile and dealer request |
| /account/password | Confirmed authenticated account; matching password update |
| /admin | Confirmed account with a current database admin grant; access entry only |

One account can buy and sell. A submitted dealer business name stays pending. Users cannot set admin membership or dealer verification. Sign-out is scoped to the current device. Full Sinhala/Tamil, PWA, administrative verification and auctions remain future phases.

Only used passenger cars are supported; other categories are visibly unavailable. Public prices are seller asking prices in exact LKR cents. Draft expected/minimum/Buy Now prices remain private. Condition/history is seller-declared; approval for display is not an inspection claim. Five migrations create account/public foundations and private seller intake. See [Database](docs/DATABASE.md) for ownership, visibility, limits and photo cache behavior.

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

`test:e2e` runs three production modes at http://127.0.0.1:3100: deliberately unconfigured, a loopback marketplace REST/Storage adapter backed by PGlite executing actual migrations/RLS, and controlled Auth/profile transport for the focused auth-experience browser suite. The first two cover discovery, filters, gallery/visibility and guest Auth regressions; the third checks forms, email instructions/cooldowns, safe returns, profile saving and logout UI using synthetic responses. Keep port 3100 free. It changes child-process settings only, leaves environment files untouched, closes resources and restores the normal configured build in finally blocks. A forcibly interrupted runner may require `npm run build` manually. The Auth transport is not GoTrue/SMTP and does not complete provider-backed signup/login/recovery/session acceptance.

If bundled Chromium is unavailable and Google Chrome is installed, set PLAYWRIGHT_CHANNEL=chrome (PowerShell: `$env:PLAYWRIGHT_CHANNEL='chrome'; npm.cmd run test:e2e`). This uses isolated contexts, not your personal browser profile.

`npm run test:e2e -- --auth-only` runs only the controlled Auth UI mode and restores the ordinary build afterward. It is useful for focused form/cooldown changes; run the full suite for broader regressions.

PGlite tests execute real PostgreSQL using synthetic Auth/Storage schemas. The marketplace browser adapter simulates REST/Storage transport; the separate Auth UI adapter simulates Auth/private-profile responses. Neither is actual PostgREST/Storage/GoTrue/SMTP hosting. Seeds under tests/fixtures and these loopback adapters are explicitly test-only, never migrations or application fallbacks. Provider interactions in unit tests are mocked. PHASE_LOG.md distinguishes those boundaries.

## Browser hydration troubleshooting

For the `ListingState` trace with `- bis_skin_checked="1"`, the minus line means the browser DOM contains an extra attribute that React did not render. The named component is where React detected the modification. Disable the injecting extension's access to `localhost`, then reload the page; if site-specific access controls are unavailable, temporarily disable the extension while using the local app. Adding suppression to `ListingState` does not resolve the DOM injection.

If the development console reports extra `bis_skin_checked`, `bis_register` or `__processed_…` attributes across the page, a browser extension is modifying the DOM before React hydrates. These attributes are not generated by AutoBid LK. Open the same URL in a fresh browser profile with extensions disabled; in Incognito, also check that no extension is allowed to run there. Disable the responsible extension for the local site, reload, then re-enable extensions individually to identify it. The [Next.js hydration guidance](https://nextjs.org/docs/messages/react-hydration-error) documents extension-modified HTML as a cause.

The root body has a narrowly scoped suppressHydrationWarning for injected body attributes such as `__processed_…`; hydration diagnostics on child elements remain active. This tolerates the reported body-only injection; extensions that also modify nested elements must still be disabled for the local site. The public-shell Playwright test checks runtime/hydration console errors and simulates the reported body injection before React loads.

To check development-mode hydration explicitly, set E2E_DEV_SERVER=1 and run `npm exec -- playwright test tests/e2e/foundation.spec.ts`. This reuses an existing local development server on port 3000, or starts one if absent. The normal test:e2e runner forces production mode with its own port-3100 server. Use the documented Chrome fallback if needed; clear E2E_DEV_SERVER after direct development checks.

## Remaining configured-Supabase acceptance checks

After approved local/development configuration:

1. Review and apply all five migrations to an authorized disposable local/development Supabase database; verify schema, grants, facets/seller RPCs and both private photo buckets with actual provider APIs.
2. Create synthetic test accounts through /sign-up. Confirm an email, sign in, save own details, sign out and check expired/revoked sessions.
3. Request password recovery, consume its email link, save a new password and verify the old password no longer signs in. Replay/expire links and confirm safe failure.
4. Confirm account A cannot read/write account B; metadata edits cannot create admin grants; dealer requests cannot self-verify.
5. Separately authorize/provision/revoke a test admin grant and confirm /admin observes both changes. Check refresh cookies across multiple requests and absence of public caching.
6. Using separately authorized synthetic listings/photos, verify only approved, already published rows/photos appear in home, filters and details; draft/rejected/removed/future rows stay hidden. Confirm public/customer writes and private-profile access are denied. Revoke approval and verify raw photo delivery immediately denies access; account for the optimized image cache described in DATABASE.md.

These checks are pending, not reported as passed.

## Production/deployment guidance

Target Vercel's Next.js preset and Node 24 with npm ci/build. No deployment was performed. Public settings are fixed at build time; use the correct HTTPS site origin, project URL and publishable key. Finish configured Auth verification and later security/localization/performance/release gates before launch. Keep the foundation's noindex setting until approved release readiness.

Read [AGENTS.md](AGENTS.md), [Architecture](docs/ARCHITECTURE.md), [Database](docs/DATABASE.md), [Roadmap](docs/ROADMAP.md), [Phase log](docs/PHASE_LOG.md) and [Decisions](docs/DECISIONS.md).

## Selected visual design

Stage 5 implements the seller experience using the existing design system and Supabase SSR client. Follow exactly five steps, resume the saved step, save incomplete drafts automatically, manage up to 12 private photos and submit once into a locked pending state. Prices use exact cents; the private minimum is never joined into public reads. Phone numbers stay unverified. Seller fees/auction commitments require approval and agreement before future publication; no payment is collected here.

Run `npm run test:e2e:seller` for isolated production seller checks and `npm run qa:seller` for five-width captures on port 3106. Use the documented Chrome fallback when needed. Both restore the normal build. The seller transport executes actual migrated PostgreSQL/RLS for drafts and Storage object policies, with simulated Auth/PostgREST/object transport. It is not hosted-provider acceptance. [Stage 5 inventory, evidence and remaining gates](docs/design/stage-5-2026-10-11/implementation.md) document the distinction. No migration was applied to a real project. Stop after Stage 5.

UI Redesign Stage 4 refines existing authentication/account screens using the same design system. Registration asks for email/password, with optional name entry in the profile; password visibility, inline guidance, email instructions/cooldowns and safe return links improve the journey. The account page separates profile/access and collapses optional dealer details. Existing SSR/confirmation/recovery, owned writes and grant checks remain. [Stage 4 files, checks, screenshots and provider limits](docs/design/stage-4-2026-10-11/implementation.md) distinguish controlled UI tests from actual Auth acceptance. `npm run qa:auth` captures isolated production states on port 3105 and restores the ordinary build; keep it separate from other builds/E2E and leave that port free. Stage 5 subsequently adds the seller functionality described above.

UI Redesign Stage 3 refines `/vehicles/[slug]`: a photo-first gallery with touch/keyboard navigation and full-screen viewing, clear asking price and bidding-unavailable information, early condition disclosures, readable specifications and real related cards. Browse links retain validated search context. [Stage 3 files, decisions, results and screenshots](docs/design/stage-3-2026-10-11/implementation.md) record five-width/state QA and remaining acceptance limits. `npm run qa:details` captures isolated production states on port 3104 and restores the ordinary build; run it separately from builds/E2E and keep that port free. Further UI stages require a new instruction.

UI Redesign Stage 2 refines /vehicles, shareable search/filters/sorts and the shared cards using the Stage 1 identity. Mobile filters have a full-height dialog with visible actions; desktop uses the same controls in a sidebar. Model/year are visible, with fuel/transmission/mileage under More filters. Cards use one detail link and clearly labelled asking prices. No migration or new workflow. [Stage 2 files, decisions, test results and screenshots](docs/design/stage-2-2026-10-11/implementation.md) record completed five-width QA and provider acceptance limits. `npm run qa:browse` captures isolated production states on port 3103 and restores the ordinary build; run it separately from builds/E2E and keep that port free.

The Phase 2 presentation follow-up applies the user-selected Premium Automotive Minimalism direction to existing public marketplace and account-form surfaces. Warm white, charcoal, restrained green and a small gold accent support direct search, readable LKR asking prices and simpler mobile layouts. The homepage photo is generated illustrative imagery, clearly labelled as not a listing; public listing photos still use the existing approved-media boundary. Geist is locally hosted with its license and source recorded in src/app/fonts/.

See [original design implementation and assets](docs/design/redesign-2026-10-10/implementation.md) and [visual QA](design-qa.md). At that earlier stage, selling was information only. Stage 5 now connects that introduction to owned private drafts and pending submissions. Provider acceptance remains pending.

UI implementation Stage 1 covered the design system and public homepage only. It added focused header/footer/homepage sections, the hero's clearly unavailable selling action, the requested buyer guide, shared container/type tokens and locally hosted Noto Sans Sinhala/Tamil script fonts alongside Geist. Existing approved-listing queries, cards, search, private access and prior browse/detail work were retained at that stage. [Stage 1 implementation, file inventory and evidence](docs/design/stage-1-2026-10-10/implementation.md) records its five-width/state checks and production test results. Fonts prepare readable script rendering; only English UI is offered.

The phase log records development-only lint dependency advisories and this environment's Git ownership issue. If Git reports dubious ownership, `git -c safe.directory=D:/Project/AutoBid-LK status` gives a scoped inspection; an authorized administrator should correct ownership for normal use. No global Git trust setting was changed.
