# Architecture

## Modular monolith

One Next.js application organized by domain feature. Routes and Server Actions stay thin; feature services enforce rules and Zod schemas validate inputs. Shared UI/utilities do not depend on features. No ORM, generic repository layer or microservices.

## Current tree

```text
src/
  app/                 homepage, catalog/details/photos, information, auth/account/admin
  components/
    ui/                source-owned Button, Input and native-dialog drawer
    layout/            responsive site shell
  features/
    auth/              schemas, services, guards, actions and forms
    profiles/          owned profile/dealer requests, schemas and actions
    marketplace/       homepage and pre-release information views
    vehicles/          public queries/DTOs/search/money and focused vehicle UI
  i18n/                typed English copy, locale and market conventions
  lib/
    env.ts             public site configuration
    supabase/          config, SSR clients/proxy and cookie-free public read client
    utils/cn.ts        class-name merging
  types/database.ts    generated from migrated PostgreSQL catalog
  proxy.ts             refresh/caching hooks for auth and protected routes
supabase/
  config.toml          local Auth/DB settings; no credentials
  migrations/          private account foundation and public listings/media/Storage
  templates/           English confirmation/recovery emails
scripts/               database types, E2E runner and loopback marketplace test adapter
tests/
  unit/                configuration, services, guards and session refresh
  integration/         PostgreSQL migration/RLS tests (PGlite)
  fixtures/            synthetic Auth/Storage, listing seeds and raster (tests only)
  e2e/                 shell/Auth regressions, marketplace and responsive behavior
docs/                  requirements, architecture, roadmap and phase evidence
```

`@/*` resolves to `src/*`. Future modules include seller-listings, verification, auctions, bidding, notifications/watchlists, transactions and moderation. Add them only in their authorized phases.

## Public rendering

The root layout validates the site URL, loads metadata/common copy and renders the shared shell. The homepage/catalog/details now render dynamically for current public data and never check a session. My account leads to a protected server page. Proxy still matches auth/account/admin routes only; missing configuration does not gate public information or render private content.

The root body tolerates extension-injected attributes with suppressHydrationWarning at that element only. This is a documented one-level React escape hatch for the observed `__processed_…` marker; children retain hydration diagnostics. It does not repair nested extension mutations or change SSR/Auth behavior. A pre-hydration body-injection browser regression exercises rendering and navigation in development and production modes.

Homepage sections and browse views are feature components with thin App Router entry points. Information routes use a finite six-page allowlist. Vehicle search has a single Zod URL schema: car category, bounded text/years/exact cents, valid districts/sorts and pages 1–1000. SQL receives escaped LIKE values and fixed ordering names; sorting has an ID tie-breaker. Pagination fetches 12 cards with exact count; homepage six, related query five then at most four excluding the current listing. Facets use a security-invoker RPC limited to 100 makes/200 make-model pairs. No client-side unlimited catalog filtering.

The server-only public client uses the existing validated publishable configuration with no cookies/session persistence and no-store, timeout-bounded requests. Public queries use explicit safe projections plus status/approval/publication checks, independently reinforced by RLS/column grants. Runtime DTO validation rejects malformed responses with sanitized feedback. Private profiles, seller identity, reserves and moderation data are never joined or stored in this read model. Account/admin services and permissions are preserved.

The detail layout resolves cached request-local visibility before a loading boundary can flush a response, ensuring unknown/private/removed slugs return HTTP 404. Page and metadata reuse the same lookup. Browse uses its own Suspense card skeletons; details have a child skeleton, gallery fallback and friendly database errors. Native dialog drawers provide modal focus, Escape dismissal and focus restoration; link navigation closes the persistent mobile menu.

Photos live in a private Storage bucket with approved media/parent RLS. The UUID-based local photo route rechecks visibility, validates the storage path, raster MIME and 10 MiB size, then returns no-store/nosniff bytes. Next Image permits only this local path, uses responsive sizing/fixed aspect ratio and lazy loads cards. Optimized public derivatives can remain cached after approval revocation; see DATABASE.md. No arbitrary external image host, SVG or private-document URL is accepted.

## Authentication and authorization

Forms -> thin Server Actions -> validated feature services -> request-scoped Supabase client. Actions use Next.js's same-origin protections and return message keys instead of provider internals or passwords. Forms preserve non-secret email/name fields, clear password inputs on completion and show pending/error/success feedback. Read-only pages remain Server Components.

- `browser.ts` uses createBrowserClient. `server.ts` is server-only and creates a request-scoped createServerClient with getAll/setAll cookie adapters. No elevated client/key is configured.
- Proxy calls getClaims before rendering to refresh/verify tokens. It forwards writes to both request and response, preserves every refreshed cookie and SDK cache headers across multiple writes, and avoids stale request-header overrides.
- Protected pages call guards independently of Proxy. getUser validates with Auth; an email-confirmed, non-anonymous account is required. Invalid/expired/unavailable sessions fail closed. Mutation services independently validate identity.
- Admin access requires a current own-row database grant. Missing/error/revoked grants deny access. Editable user metadata and profile fields never authorize privileges.
- Buying and selling are capabilities of the same account. Verified dealer capability requires a verified dealer record, not a self-asserted role.
- Profile mutations derive ownership from the validated user. RLS and column privileges enforce the second boundary. Dealer requests supply only business name; verification defaults to pending and is immutable to the customer.
- Auth/private pages are dynamic with private/no-store responses. Supabase's refreshed cache/expiry/pragma headers are preserved. Cookies use SameSite=Lax and Secure when the trusted site origin is HTTPS; browser-readable storage follows the official SSR model.

Signup/recovery support PKCE `/auth/callback` code exchange and token-hash `/auth/confirm` verification. Only email/signup/recovery token types and fixed internal destinations are accepted. Redirect origins use validated site configuration, not Host or user input. Invalid/expired links lead to sanitized sign-in feedback. Password updates require a validated account and matching new passwords; successful updates attempt current-device sign-out.

Missing, partial or unsafe Supabase configuration returns no client, disables auth forms with plain-language feedback and denies private pages. Public configuration is allowlisted. Rejecting a mistakenly supplied elevated key does not make NEXT_PUBLIC_* secrets private; never put them there.

Supabase enforces provider Auth rate limits; actions map throttling to understandable feedback. Production provider limits/SMTP and abuse controls must be reviewed before release. No unbounded in-memory rate limiter or fake session implementation is introduced.

## Database and verification boundaries

SQL owns relationships, constraints, timestamps, profile provisioning, public visibility, RLS and column grants; see DATABASE.md. Types are generated by executing migrations in PGlite and introspecting PostgreSQL's catalog. The generator covers current scalar columns (including integer/bigint/boolean), generated-column write restrictions, single-column foreign keys and the current no-argument JSONB facets RPC. Extend it or adopt Supabase CLI generation as the schema expands.

PGlite tests exercise actual PostgreSQL with synthetic Auth/Storage schemas and customer roles. Service/guard tests mock the provider. E2E first builds without configuration, then uses a loopback test-only REST/Storage adapter running the same SQL/RLS and seeds. It supplies no production data, implements no Auth service and closes before the runner restores a normal build. Tests do not verify actual GoTrue, PostgREST, Storage service, SMTP, signing keys or deployment defaults. Public configuration is present; earlier provider checks reported missing tables, while the latest Stage 1 normal UI shows zero approved listings. This observed public UI state does not complete provider Auth/media/schema acceptance, which remains pending in PHASE_LOG.md.

## Styling and localization

Tailwind 4/PostCSS and CSS-first semantic tokens remain the design source. The selected Premium Automotive Minimalism direction uses warm white #F8F9F7, white surfaces, charcoal #162027, green #126657, muted #5B6770, sparse gold #D99A43, structural borders #E0E5E2 and stronger control borders #85948C. Semantic danger is #B42318. Body text is 16px with 1.6 line height; UI/support text is 14px; the home display scale responds from 30px to 44px with 1.15 line height; section/price scale is 24px. Spacing uses a 4px scale and radii derive from 8px. The shared site-container has an 80rem maximum and 20/32/40px responsive gutters.

Licensed Geist and script-only variable Noto Sans Sinhala/Tamil WOFF2 assets are bundled through next/font/local. Script fonts use Unicode ranges, swap and preload=false; explicit lang=si/ta spans choose the corresponding family. Browser glyph inspection confirms both custom fonts, with no third-party font requests. Font provenance/licenses live in src/app/fonts/ and the Stage 1 manifest. Primary controls are at least 48px high, with wrapping labels and focus/disabled states. Semantic landmarks, skip link, decorative icon hiding and reduced-motion behavior remain intact.

The homepage keeps search ahead of its image on mobile. Its separately generated, optimized static automotive hero is explicitly illustrative, not listing photography; only that exact image path is added to Next Image's local allowlist. Approved listing media continues through the existing private Storage/public visibility boundary. The seller information route displays a static ordered list of future stages, not an interactive wizard. See docs/design/redesign-2026-10-10/implementation.md and design-qa.md for the selected direction and visual evidence.

Stage 1 splits SiteHeader/SiteFooter from the shell and composes HomepageHero, VehicleCategoryList, RecentVehicles and HowItWorks. The original VehicleSearch/Grid/Card/Skeletons/ListingState and bounded six-row query are reused. The hero's secondary selling link opens the existing coming-soon information route; the guide ends with Bid when available. Account navigation retains /account and existing server-validated access/guest redirects. Public rendering introduces no new session lookup. Browse/detail, authentication/profile/query and database files were preserved byte-for-byte against this stage's starting state. See docs/design/stage-1-2026-10-10/implementation.md for scope and current evidence.

Application copy, accessibility labels and metadata live in typed dictionaries. Known locales are en/si/ta; only English is rendered. Do not offer an untranslated locale. The stored preferred locale reserves future preferences without exposing a nonworking selector. English provider emails use language-specific templates under supabase/templates/. Full translations, locale routing and formatting remain later work.

## Future domain integrity

Private document access, auction lifecycle and bidding are not implemented. Future bids require atomic PostgreSQL transactions/locks, server time, idempotency and committed Realtime broadcasts. Money uses exact integer minor units. Add those services and database policies only in their authorized phases.
