# Architecture

## Modular monolith

One Next.js application, organized by domain feature as those features are introduced. Route pages/API handlers delegate business rules to cohesive feature services and input validation to Zod schemas. Avoid generic repository layers, microservices and classes without an actual need. UI imports feature-facing services; shared components/utilities do not depend on features. Keep feature dependencies explicit and prevent cycles.

## Current tree

```text
src/
  app/                 root layout, starter page, error/404, CSS tokens, icon
  components/
    ui/                shadcn-style Radix Button
    layout/            site shell
  i18n/
    dictionaries/      English copy and dictionary shape
    config.ts          locales, availability and market defaults
    get-dictionary.ts  typed lookup with explicit English fallback
  lib/
    env.ts             allowlisted public configuration and validation
    utils/cn.ts        class-name merging
tests/
  unit/                configuration security tests
  e2e/                 production-shell browser checks
docs/                  requirements, architecture, roadmap and phase evidence
```

`@/*` resolves to `src/*`. Do not create empty future folders. When needed, add:

```text
src/features/<feature>/  services, schemas, domain-specific UI/types
src/lib/supabase/        separate browser and server clients (Phase 1)
src/types/               genuinely shared/generated database types (Phase 1)
supabase/migrations/     versioned SQL schema and policies (Phase 1)
tests/integration/      persistence/authorization tests with isolated fixtures
```

Features planned: auth/profiles, vehicles, seller-listings, verification, auctions, bidding, watchlists/notifications, transactions and moderation. Add only the modules authorized for the current phase.

## Phase 0 rendering/data flow

The root layout validates the public site URL, obtains English metadata/common copy and renders the shell. The homepage reads dictionary copy and renders static sections. Server Components are the default. The error recovery boundary is the only custom Client Component; the Radix primitive supplies composition behavior. There are no database calls, route handlers, sessions or business services yet.

## Styling and accessibility

Tailwind 4 uses its official PostCSS plugin and CSS-first tokens in `globals.css`. Semantic color tokens define background, foreground, muted surfaces, green primary, pale lime accent, border and focus ring; primary hover/active colors are explicit. Typography uses a system sans stack with Sinhala/Tamil-capable fallbacks, 16px body text and responsive headings. Spacing uses a 4px scale; radius tokens derive from 12px. Buttons have 44px minimum targets, wrapping labels and disabled/focus states. Layouts use fluid widths rather than fixed heights.

The shell contains header/navigation, skip link, a focusable main landmark and footer. Decorative icons are hidden from assistive technology. Essential content and in-page navigation work without JavaScript. Reduced-motion preferences suppress transitions. Future data-dependent features add loading, empty and success states when their behavior exists.

## Localization

All visible copy, accessibility labels and metadata live in dictionaries. `Dictionary` widens English string literals while preserving key structure, allowing future translations to satisfy the same type. Known locales are en/si/ta; only en is available now. Lookup falls back to English and root HTML uses en. Do not select a language that is not actually rendered. Add reviewed translations, locale-aware routing/HTML attributes and centralized plural/date/currency formatting in their authorized phases. Do not concatenate translated sentence fragments or fix container sizes to English text lengths.

## Future trusted data flow

Browser interactions -> thin authorized server entry -> validated feature service -> Supabase/PostgreSQL with RLS. Use documented Supabase SSR cookie/session handling and separate browser/server clients. Generate TypeScript types from versioned migrations. Private documents require authenticated authorized retrieval. Bid acceptance must occur in an atomic PostgreSQL function/transaction with locks and idempotency; Realtime only delivers committed state. Server time remains authoritative.

Only deliberately allowlisted `NEXT_PUBLIC_*` values may cross the browser boundary. Future elevated clients must be server-only and never bypass user authorization inadvertently. Do not export the full process environment or include submitted values in configuration error messages.
