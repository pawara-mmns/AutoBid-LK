# Selected design implementation — 2026-10-10

The user selected the first displayed direction, Premium Automotive Minimalism. Implemented in the existing Next.js modular monolith, as a Phase 2 presentation follow-up.

Design: warm #F8F9F7 background, white surfaces, #162027 charcoal, #126657 green, muted #5B6770, border #E0E5E2, sparing non-text #D99A43 gold. 4px spacing scale, 8px base radius, 16px body, 14px supporting text, 44px desktop home heading, 24px asking prices with tabular numbers. Primary controls at least 48px high, links/secondary targets at least 44px where interactive. Self-hosted licensed Geist with existing script fallback stack; only English is offered.

Homepage: direct search, one browse link, an illustrative photo, one supported-category row, eligible recent listings or truthful empty/error state, compact guide and simple footer. No unsupported category tiles, fabricated listings or auction activity. Recent vehicles remain from the original bounded public query. The hero is an image asset, not a screenshot used as page content.

Browse/details: retained URL filtering, four explicit-submit sorts, pagination, public queries, projections, visibility and photo gate. Simplified filter presentation, full-width price fields, mobile dialog, clearer asking-price hierarchy, essential mileage/fuel/transmission summary, lighter availability and disclosure sections. Same forms and gallery behavior.

Auth/seller: direct registration title, quieter form surface and unchanged server actions/validation. Selling navigation indicates coming soon; the information page shows five planned steps as a static list. No wizard, uploads, drafts or submission behavior was built.

## Hero provenance

public/images/automotive-hero.webp — 1536×1024, 231,616 bytes (~226 KiB).
Built-in Image Gen; separate raster generated from the selected concept, then optimized with the existing sharp package. Generation brief: illustrative silver everyday compact hatchback, full vehicle visible in a three-quarter front view on a quiet Sri Lankan residential road with lush trees and warm daylight, blank plate, no people, UI, text or fade. The asset is labelled Illustrative image — not a listing in the application. It is never used as approved listing photography. Sharp was already installed through Next.js; no dependency added.

Font provenance and license: ../../../src/app/fonts/README.md and OFL.txt. Font source revision 10dc7658f13c38a474cde201bb09a4617267545b from the official Vercel repository. See https://nextjs.org/docs/app/getting-started/fonts for the official local font pattern; version-matched documentation was also checked locally.

## Scope boundaries

Public discovery services, schemas, database, auth/provider contracts and roles are unchanged. No live database mutation, deployment, commit or push. No Phase 3 work, live bids, payments, localization selector or new marketplace category. Existing hydration compatibility and unrelated uncommitted work retained.

Visual evidence and verification are recorded in the root design-qa.md and the phase log after final checks.

## Final evidence

The root design-qa.md records the source/implementation comparisons, corrections and final result: passed. The latest screenshots and normal-checks.json/fixture-checks.json/accessibility-checks.json live here. Control edges use a dedicated #85948C token (3.18:1 against white), preserving light structural borders.

Executed checks: npm run check (lint, strict types, 126 Vitest/PostgreSQL tests), db:types:check, production E2E (20 passed in unconfigured mode, 28 passed with isolated fixtures), final lint/typecheck and builds. E2E passed before final CSS refinements; final responsive/interaction captures passed afterward. No horizontal overflow/pageerror in five-width capture matrices. See the phase log for precise test/provider boundaries.
