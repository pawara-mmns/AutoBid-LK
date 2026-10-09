# Phase log

## Phase 2 — Public Vehicle Marketplace

Date: 2026-10-09 (Asia/Colombo). Status: source implementation and isolated verification complete; actual provider migration/media/Auth acceptance pending. Phase 3 is not started or authorized. Historical Phase 0/1 entries below describe their state at delivery; this entry supersedes their next-phase/configuration status.

### Starting state and preserved work

Read AGENTS.md, README and all six project documents, inspected routes/Auth clients/migrations/theme/tests and the uncommitted Git tree, then summarized architecture, prerequisites, modules and the scoped plan before editing. The existing modular monolith, semantic tokens, English dictionary conventions, Supabase SSR/Auth guards, private profile/dealer/admin rules and npm/Vitest/Playwright tools were reused. Prior uncommitted Phase 1 work was preserved; no authentication business logic, secret file, dependency version, global Git trust or execution policy was replaced.

Unlike the Phase 1 snapshot, ignored .env now contains public project settings. Read-only SDK REST checks returned PGRST205 for the known profiles/vehicles/vehicle_listings/vehicle_media names. No exposed vehicle table or local vehicle migration was found. No remote migration, account, listing, bucket, email or approval was created. Environment values were not printed. The existing port-3000 process was left running; isolated browser servers use port 3100.

### Milestones and completed behavior

| Milestone | Result |
| --- | --- |
| 2.1 Homepage | Public friendly hero/search, functioning browse/sell/account navigation and mobile menu, car/future categories, six eligible recent cards, honest three-step buyer explanation and functioning about/contact/help/terms/privacy routes. |
| 2.2 Browsing | Search, car category, brand/model, exact LKR range, manufacture years and district; four database sorts, exact count and 12-card pagination; shareable bounded URL parameters, active indicators, desktop panel/mobile drawer, Apply/Clear and safe empty/error states. |
| 2.3 Details | Cached pre-stream eligibility/404 gate; optimized controlled gallery, summary/specifications, declared defects and nullable histories, display-approval explanation, modular bidding-unavailable boundary and at most four genuine related listings. |
| 2.4 Database integration | Two-table public-safe migration, private photo bucket, constraints/indexes/timestamps/RLS/column grants, bounded facets RPC, public server client and generated types. Actual Supabase application/acceptance remains pending. |
| 2.5 Testing/optimization | Unit/security and actual PostgreSQL RLS checks, production browser suites, 360px/768px/desktop checks and screenshot review, image limits/fallbacks/lazy sizing, no unlimited fetch and automatic normal-build restoration. |

No private seller identity/contact/documents, chassis, reserve or moderation fields are exposed or introduced. Prices mean asking prices, never live bids. Display approval never implies inspection. Other vehicle types, seller submission, admin review, auction engine and payments remain unavailable. No additional Phase 2 dependencies or test framework were introduced.

### Phase 2 file inventory

Created:

- `supabase/migrations/202610090002_public_marketplace.sql`.
- `src/app/[information]/page.tsx`; `src/app/vehicles/page.tsx`, `error.tsx`, `[slug]/page.tsx`, `[slug]/layout.tsx`, `[slug]/loading.tsx`; `src/app/vehicle-images/[listingId]/[photoId]/route.ts`.
- `src/features/marketplace/homepage.tsx`, `information-page.tsx`.
- `src/features/vehicles/queries.ts`, `search-schema.ts`, `money.ts`, `types.ts`, `browse-page.tsx`, `details-page.tsx`, `listing-state.tsx`, `auction-information.tsx`, `vehicle-card.tsx`, `vehicle-grid.tsx`, `vehicle-gallery.tsx`, `vehicle-photo.tsx`, `vehicle-price.tsx`, `vehicle-specifications.tsx`, `vehicle-search.tsx`, `vehicle-filters.tsx`.
- `src/lib/supabase/public.ts`, `src/components/layout/mobile-navigation.tsx`, `src/components/ui/modal-drawer.tsx`.
- `scripts/marketplace-fixture.mjs`; `tests/fixtures/storage-schema.sql`, `marketplace.sql`, `vehicle-photo.png`; `tests/unit/vehicle-search.test.ts`, `tests/integration/marketplace-rls.test.ts`, `tests/e2e/marketplace.spec.ts`.

Modified: `src/app/page.tsx`, `src/components/layout/site-shell.tsx`, `src/i18n/dictionaries/en.ts`, `src/types/database.ts`, `next.config.ts`, `playwright.config.ts`, `scripts/generate-db-types.mjs`, `scripts/run-e2e.mjs`, `tests/integration/rls.test.ts`, `tests/e2e/foundation.spec.ts`, `tests/e2e/auth-foundation.spec.ts`, `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `DATABASE.md`, `ROADMAP.md`, `DECISIONS.md` and this log. Other dirty/untracked Phase 1 files predate this scope and were retained. A temporary parent catalog loading file was moved into ignored .local/phase2-retired after it caused premature streaming; browse now uses an explicit Suspense boundary.

### Actual verification

| Command/check | Actual final result |
| --- | --- |
| `npm.cmd run check` | Passed: zero lint warnings/errors, strict TypeScript/route generation and 126 tests across 8 files. Includes existing Auth/ownership/admin/session regression tests. |
| `npm.cmd run db:types` / `db:types:check` | Passed: both migrations execute in isolated PostgreSQL; generated catalog types match. |
| `npm.cmd run build` | Passed in unconfigured, isolated fixture and normal configured modes. Home/catalog/details/photo endpoints are dynamic; information pages prerender. |
| `PLAYWRIGHT_CHANNEL=chrome npm.cmd run test:e2e` | Passed: unconfigured 18 passed / 10 fixture-only skipped; fixture mode 26 passed / 2 unconfigured-only skipped. Runner stopped fixture/server resources and restored the normal build. |
| Responsive and visual review | 360px mobile, 768px tablet and desktop browser assertions passed without horizontal overflow. Homepage, filtered cards, tablet grid and detail screenshots inspected; compact mobile navigation, keyboard dialog Escape/focus restoration and image fallback verified. |
| Read-only configured project inspection | Public configuration detected without printing values; known table GET checks returned PGRST205. This is a blocker finding, not a deployed-schema pass. |
| Normal configured production HTTP smoke | Port 3101: home/catalog returned 200 with friendly unavailable feedback, no fixture cars or PGRST205 disclosure; invalid detail/photo IDs returned 404; guest account/admin returned 307 to sign-in. Its server was stopped; existing port 3000 was preserved. |

Browser checks initially exposed hidden-detail HTTP 200 responses after a loading boundary had flushed. The final layout resolves visibility first; all hidden/draft/pending/rejected/removed/future/unknown fixture details now return HTTP 404. Invalid URL filters produce sanitized feedback. Empty/image-free cases, approved photo delivery and denied unapproved/invalid photo URLs pass. Test listings/raster are confined to in-memory PostgreSQL and loopback transport, never a normal application fallback.

### Security and known limitations

- Public/client roles have read-only explicit-column privileges for approved, already published listings/media; RLS enforces eligibility even for direct APIs. Mutation attempts and future-private-column reads fail in actual PostgreSQL tests. Private profile/dealer/admin permissions remain unchanged.
- Photos use a private bucket and a controlled local raster endpoint. Raw access denies after visibility revocation. Previously delivered/optimized public bytes may persist in caches; 60 seconds is Next Image's minimum TTL, not a guaranteed purge deadline. Review provider/CDN purge behavior before launch.
- Loopback transport and synthetic Auth/Storage schemas validate application queries plus PostgreSQL RLS, not actual GoTrue/PostgREST/Storage/SMTP services. Real signup/confirmation/recovery/session renewal, provider grants and hosted photo acceptance remain pending. No full production load/accessibility/security audit is claimed.
- There are no actual eligible project listings until reviewed migrations and separately authorized real data/publication exist. Unavailable states are intentional. Terms/privacy/contact pages are honest pre-release information and need final policy/contact review before launch.
- Carried-forward tooling: isolated installed Chrome was used instead of the unavailable bundled download; Git needs the scoped ownership trust option; ESLint 9 maintenance and the previously reported development-only lint-chain advisories remain. No new dependency or force override was introduced.

### Outstanding requirements and manual review checklist

1. Review/apply both migrations in an explicitly authorized disposable Supabase environment; verify real PostgREST column grants, RLS, facets and private Storage bucket limits. Confirm tests' stand-in schemas match actual provider assumptions.
2. Complete README's Phase 1 provider-backed Auth/email/session/admin/dealer/ownership acceptance checks with synthetic accounts and separately authorized provisioning.
3. With separately authorized test listings, manually check first-time homepage search; shared URL filters, all sorts/pagination; keyboard/mobile drawer; 360px/tablet layouts; gallery and missing photos; unknown/private/future/removed 404s; approval/photo revocation. Confirm unrelated private profiles/documents are unavailable.
4. Review final customer copy, contact details, terms/privacy, approved photo handling/cache purging and realistic device/network performance before release. Full translations/PWA and load/release audits remain their roadmap phases.

Phase 2 repository work stops here. No commit, push, deployment or live database change. Wait for explicit authorization before Phase 3; no seller wizard/dashboard, verification/admin workflow, bidding/closure/winner engine, payment/escrow/subscription or international/native-app feature was built.

## Phase 1 — Authentication & Database Foundation

Date: 2026-10-09 (Asia/Colombo). Status: implementation and isolated verification complete; configured Supabase acceptance checks blocked. Phase 2 remains unauthorized and not started.

### Starting state and preserved work

Read AGENTS.md, architecture, roadmap, phase log, README and decisions; reviewed the existing shell, copy, configuration and tests. The initial Git diff contained only Next.js-generated next-env.d.ts development references. No unrelated handwritten work was changed. The public homepage and original shell tests remain intact; only an account entry link was added to the shell. No commit, push, deployment or live database operation was performed.

### Implemented

- Official @supabase/ssr and supabase-js clients with browser/server separation, safe public configuration, consistent cookie options and scoped Next.js Proxy refresh. No elevated application credentials.
- Signup, sign-in, current-device sign-out, email confirmation, password recovery/update, pending/error/success feedback and safe missing-config mode.
- Protected account/password pages and an admin-access entry page. Server code validates confirmed non-anonymous users; metadata cannot confer privileges. Current database grants govern admin access.
- Owned profile editing and optional pending dealer business profiles. Buying/selling share one account; dealer verification and admin membership cannot be changed by customers.
- One migration with three genuinely needed tables, Auth provisioning trigger, foreign keys, constraints, relevant indexes, timestamps, column grants and own-row RLS. No future marketplace/auction/verification-document tables.
- Migration-derived database types and consistency tooling; reproducible SQL/RLS verification in isolated PGlite, using a synthetic Auth schema rather than pretending a provider is configured.
- Local Supabase configuration and English token-hash email templates; README setup steps, database relationship/access documentation and architecture/roadmap/decisions updates.

### Actual verification results

| Command/check | Result |
| --- | --- |
| npm.cmd run lint | Passed, zero warnings/errors after removing unused sign-out arguments. |
| npm.cmd run typecheck | Passed with strict checking and Next.js route generation. Initial test fixture lacked required User fields; fixed. |
| npm.cmd run test | Passed, 77 tests in 6 files, including real PostgreSQL RLS/privileges, services, route guards, config and cookie refresh. |
| npm.cmd run db:types | Passed; migration executed in isolated PostgreSQL and types generated from catalog columns/foreign keys. |
| npm.cmd run db:types:check | Passed; generated file matches migrated catalog. |
| npm.cmd run build | Passed; homepage stays static, auth/account/admin routes are dynamic, Proxy compiled. |
| PLAYWRIGHT_CHANNEL=chrome npm.cmd run test:e2e | Passed, 14 desktop/mobile production checks. The runner explicitly builds without Supabase settings and uses port 3100. |
| Screenshot inspection | Signup pages reviewed on desktop/mobile: readable copy, usable fields/buttons, wrapping navigation and no clipping. Original homepage overflow/keyboard/404 checks still pass. |
| npm.cmd audit --omit=dev | Passed; zero reported production vulnerabilities. |
| npm.cmd ls --depth=0 | Passed; expected Phase 1 dependencies resolved without invalid direct peers. |

Browser tests first found port 3000 already occupied; that process was left running and tests moved to 3100. Two subsequent test failures were ambiguous alert locators matching Next.js's route announcer; narrowed the selectors and reran all 14 successfully. Tests confirm public access, guest redirects, unavailable forms, safe invalid callbacks, private cache/referrer headers and Phase 0 behavior. They do not claim successful provider-backed signup/login/recovery.

### Blockers and remaining acceptance work

- No .env.local/project configuration is present, and Supabase CLI/Docker commands are unavailable on PATH. A full local Supabase stack was not started. Existing PostgreSQL installation was not modified.
- The migration is tested in actual isolated PostgreSQL, but has not been applied to Supabase. The local config/email templates have not been exercised by the provider/CLI. Supabase GoTrue/PostgREST/SMTP integration is not verified.
- Successful signup, email confirmation, login, refresh across real requests, sign-out, recovery, old-password rejection, expired/replayed provider links and real PostgREST access need a configured disposable local/development project. README lists the exact remaining checks. No real accounts or emails were created/sent.
- Database types are generated from the migration catalog, not from a running Supabase CLI instance. The generator intentionally supports the current scalar schema and single-column foreign keys.
- Carried-forward environment/tooling limitations remain: Git ownership requires a scoped trust option; bundled Chromium download was unavailable, so isolated installed Chrome was used; compatible ESLint 9 is deprecated and installation still reports five high-severity development-only lint-chain findings. No forced downgrade or global permission change was made.

### Stop boundary

Phase 1 source implementation is complete. Resolve the configured-provider acceptance blockers before considering Phase 2. Marketplace, seller wizard, admin review workflows, vehicle ownership verification, auction/bidding engine and payment processing have not been started. Await the next explicit instruction.

## Phase 0 — Project foundation

Date: 2026-10-09 (Asia/Colombo). Status: complete, with tooling/environment limitations below.

### Initial state and scope

The workspace was empty; no AGENTS.md, project documentation or Git repository existed. Initialized a local `main` repository without committing. The pasted instruction authorizes Phase 0 only. No prior work was overwritten.

### Implemented

- Next.js App Router with strict TypeScript, additional indexed-access checks, Tailwind 4/PostCSS and flat ESLint configuration.
- Source-owned shadcn-style Radix button with touch, focus, hover, active and disabled states; Lucide icons and shared class merging.
- Responsive server-rendered shell and truthful starter homepage; keyboard skip link, error retry and missing-page recovery.
- Semantic design tokens, system typography, 4px spacing and radius scale, reduced-motion handling.
- Typed English dictionary and locale/market conventions for en/si/ta, LK/LKR/Asia/Colombo. Only English is available.
- Optional allowlisted public environment configuration validated with sanitized failures; credential-free startup and safe `.env.example`.
- Vitest and Playwright foundation tooling; required project documentation and future acceptance gates.

### Verification

| Command/check | Actual result |
| --- | --- |
| `npm.cmd ci` | Passed; exact dependency graph installed from lockfile. Upstream development warnings remain below. |
| `npm.cmd run lint` | Passed, zero warnings/errors after navigation and PostCSS-export fixes. |
| `npm.cmd run typecheck` | Passed; Next.js route types generated and strict TypeScript checked. |
| `npm.cmd run test` | Passed, 7 environment-validation/security tests. Initial 2 failures exposed a URL-refinement exception; corrected and rerun successfully. |
| `npm.cmd run build` | Passed; static homepage, missing-page route and icon generated. |
| `npm.cmd run dev -- --hostname 127.0.0.1 --port 3001` | Ready; HTTP GET returned 200 with homepage and launch notice. Development process stopped after verification. |
| `$env:PLAYWRIGHT_CHANNEL='chrome'; npm.cmd run test:e2e` | Passed, 4 checks across desktop/mobile isolated Chrome contexts against the production server. Navigation, launch notice, no horizontal overflow, no browser runtime errors, keyboard skip link, 404 status and home recovery verified. |
| Desktop/mobile screenshot review | Visually inspected generated full-page screenshots; readable layouts, wrapping navigation, consistent spacing and no clipped content. Artifacts are in ignored test-results/. |
| `npm.cmd audit --omit=dev` | Passed, zero reported production vulnerabilities. |
| `npm.cmd audit --json` | Reports 5 high-severity development-only entries sharing the braces advisory below; not a clean full dependency audit. |
| Git inspection | Files are all newly created/untracked, with no commit, remote or push. Per-command `-c safe.directory=D:/Project/AutoBid-LK` used under the host account. |

Final checks use npm.cmd because this machine blocks npm.ps1 execution. Node is 24.18.0. The sandbox command helper began failing after initialization; local verification ran through approved sandbox escalation. No changes to machine execution policy or global Git configuration were made.

### Tooling/environment limitations

- The [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) affects the Next.js lint toolchain through micromatch/fast-glob. Registry braces 3.0.3 has no patched successor available at verification. It is not in the production dependency graph according to npm audit. Review upstream fixes before expanding the project; do not feed untrusted patterns to this tooling.
- ESLint 9.39.5 is deprecated upstream, but Next.js's current bundled React/import/accessibility plugins require ESLint 9-compatible peers. ESLint 10 was evaluated and restored to 9 after detecting incompatible peer ranges. No force fix/downgrade or unverified dependency override was applied.
- npm warns that unrs-resolver's installation script is not explicitly approved. The actual lint/build checks work with the installed platform dependency. This warning remains recorded rather than approving unrelated scripts globally.
- Playwright's bundled Chromium download stalled and was cancelled. E2E passed using installed Chrome, not bundled Chromium; README documents the fallback. Other engines/real low-cost devices have not been tested.
- Git was initialized by the sandbox account, so the host account reports dubious ownership. Attempting to assign .git ownership to the host was denied by Windows. A narrow per-command trust setting works: `git -c safe.directory=D:/Project/AutoBid-LK status`. Correct ownership through an authorized administrator before normal host-account Git use. No global trust exception was added.
- Next.js emitted a slow-filesystem warning in development; startup and HTTP rendering still passed. Device/network performance benchmarking remains Phase 7/8 work.

### Scope limitations

No auth, profiles/roles enforcement, Supabase integration, database schema/RLS, public vehicle catalog, seller wizard, admin flows, auctions/bidding, purchase/payment flows, full translations or PWA. These are intentionally deferred, not partially implemented. No live database, commit, push or deployment.

### Next phase

Phase 1 — Authentication & database, after explicit authorization. Requires Supabase local/test setup and real environment configuration; no credentials are needed to run the current foundation.
