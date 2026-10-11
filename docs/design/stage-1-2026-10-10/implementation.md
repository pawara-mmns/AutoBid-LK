# UI Redesign Implementation — Stage 1

Date: 2026-10-10, Asia/Colombo. Scope: design system, public homepage and needed shared presentation. Selected visual target: ../audit-2026-10-10/concepts/01-premium-automotive-minimalism.png. Existing project and uncommitted work were inspected and retained; no new app, dependency, schema or business workflow.

## Implemented

- Reused the selected warm-white/white/charcoal/green/gold palette, Geist and labelled 3:2 automotive illustration. Added semantic danger #B42318, responsive display (30–44px), section/UI/price scales and an 80rem site-container with 20/32/40px gutters. Existing 4px spacing, 8px radius, 48px primary controls, 44px navigation targets, outline/hover/active/focus/disabled states and reduced motion remain.
- Split shared SiteHeader/SiteFooter from SiteShell. Navigation retains browse, the existing selling-information destination and My account's server-validated access. Mobile uses the existing native modal drawer with Escape/focus restoration and link dismissal. No new public session check.
- Split MarketplaceHome into HomepageHero, VehicleCategoryList, RecentVehicles and HowItWorks. Hero search uses the existing GET/URL schema. Sell my vehicle is an outlined full-width phone action with visible coming-soon copy; the desktop action is secondary to search. Cars remain the only supported category. The requested guide ends with Bid when available, clearly unavailable.
- RecentVehicles reuses the original bounded query (six rows), public visibility, cards/grid, optimized controlled photos, asking-price formatting, skeletons and empty/error feedback. No sample data fallback or fake badges.
- Bundled actual local variable Noto Sans Sinhala/Tamil WOFF2 script subsets with their licenses and source/hash manifest. They use Unicode ranges, swap and preload=false; explicit footer language spans identify English as available and Sinhala/Tamil as planned. Glyph inspection confirmed both custom fonts. No external font requests or translated UI/selectors.

## File inventory for this stage

Created components:

- src/components/layout/site-header.tsx, site-footer.tsx.
- src/features/marketplace/homepage-hero.tsx, vehicle-category-list.tsx, recent-vehicles.tsx, how-it-works.tsx.

Created font assets: src/app/fonts/noto-sans-sinhala-variable.woff2, noto-sans-tamil-variable.woff2, noto-sans-sinhala-OFL.txt, noto-sans-tamil-OFL.txt. Source/license details are in src/app/fonts/README.md and font-provenance.json.

Modified source: src/app/globals.css, src/app/layout.tsx, src/components/layout/site-shell.tsx, src/components/ui/button.tsx, src/components/ui/input.tsx, src/features/marketplace/homepage.tsx, src/i18n/dictionaries/en.ts and tests/e2e/foundation.spec.ts. Updated README, architecture, roadmap, decisions, phase log, font notes and root design-qa.md. Evidence lives in this directory. The preceding QA report is preserved as prior-design-qa.md.

Other dirty files were already present at the beginning. SHA-256 comparisons confirm all 44 inspected authentication/profile, Supabase/schema, vehicle browsing/details and information-page files stayed unchanged. Shared tokens naturally apply to existing surfaces, but their implementations were not redesigned in this stage. next-env.d.ts is restored to its initial bytes after validation.

## Responsive and visual evidence

Normal and isolated populated homepages captured at 360, 390, 768, 1280 and 1440px, density 1. Search action's bottom edge was at y=393.3/393.4/346.1/362.8/362.8px respectively, inside every normal initial viewport. No horizontal overflow, undersized inspected primary/header/footer targets, hydration or runtime errors. 200% root text size at 360px reflowed without horizontal overflow; scrolling is expected, and this is not a complete browser-zoom audit.

Full/focused selected-reference comparisons: comparison-v1.png / comparison-hero-v1.png and final production comparison-v2.png / comparison-hero-v2.png. The initial secondary selling action had a shorter mobile edge than search; w-full below sm corrected it, then production captures confirmed alignment. Final phone/tablet, populated cards, menu, loading and error crops were actually viewed. See root design-qa.md for the five fidelity surfaces and accepted adaptations.

State checks used the existing in-memory PostgreSQL fixture and a test-only loopback proxy to delay or return empty/outage responses. Populated rows still pass actual migration/RLS filtering; six cards render. Empty/error/loading were captured at 360/1440px. The uniform test raster is not a real vehicle photo. No real project was seeded or modified. All temporary servers/database/proxy resources were closed and the normal build restored; the existing localhost:3000 development server remains available.

Contrast measurements: primary/white 6.85:1, muted/base 5.49:1, control edge/white 3.18:1 and base 3.01:1, danger/white 6.57:1. The gold accent is not used as small low-contrast text. Browser CSS glyph inspection confirms Noto Sans Sinhala and Tamil as custom fonts; requests to Google font hosts: zero. This establishes focused rendering evidence, not full WCAG/screen-reader or reviewed translation acceptance.

## Actual validation

| Command/check | Result |
| --- | --- |
| npm.cmd run check | Passed lint/strict types and 126 Vitest/PostgreSQL tests across 8 files. |
| npm.cmd run lint | Final pass: zero warnings/errors. |
| npm.cmd run db:types:check | Passed; types match migrated catalog. |
| PLAYWRIGHT_CHANNEL=chrome npm.cmd run test:e2e | Passed: unconfigured 20 / 10 fixture-only skips; isolated fixtures 28 / 2 unconfigured-only skips. Expanded existing shell check covers five widths, visible search, selling destination and guide. |
| Production builds | Passed normal/unconfigured/fixture configurations; normal build restored. |
| Focused production capture harness | 14 normal/populated/empty/error observations plus two actual loading captures, mobile menu/Escape focus and text-size reflow passed. Zero hydration/page errors or third-party font requests. |
| Preservation check | 44 protected files matched their starting hashes; no domain/schema/browse/detail implementation edits. |

The E2E/state suite passed before the final footer availability wording refinement. Final lint/build and a fresh five-width normal capture passed afterward; footer wording was verified in the browser and its actual screenshot viewed. final-footer-checks.json records that separate final copy check. The change alters text only, retaining the same links/controls/language spans.

In-app browser setup failed with the Windows sandbox helper. The existing user-authorized isolated Chrome workflow provided actual rendered verification. Initial font inspection required enabling Chrome's CSS domain; the harness was corrected and completed. Source-font TTF size exceeded the intended budget, so official compact WOFF2 subsets were used instead; no font conversion package was installed.

## Limits and stop boundary

Actual Supabase Auth/PostgREST/Storage/SMTP acceptance, full translations, screen-reader/real-device/slow-network and release audits remain separate pending requirements. The illustrative hero is not listing photography. English remains the only active UI locale. The body-only hydration compatibility remains; extensions injecting nested attributes still need disabling for localhost.

Stage 1 complete. No commit, push, deployment, live database write, seller wizard, auction/bidding/payment feature or Phase 3 work. Recommended next UI stage: vehicle browsing redesign after explicit authorization.
