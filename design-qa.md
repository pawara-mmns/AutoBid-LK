# Design QA — AutoBid LK, UI Stage 3

2026-10-11, Asia/Colombo. Result: passed for the authorized vehicle details redesign within development Phase 2. [Implementation, file inventory, decisions and evidence](docs/design/stage-3-2026-10-11/implementation.md).

Actually inspected baseline phone/desktop and final rendered details at 360, 390, 768, 1280 and 1440px, full-screen gallery, focused condition/specifications and controlled missing/single/loading/failure states. Photo-first layout, clear asking price, truthful unavailable bidding, early defect disclosures and simple specification/description order preserve the Stage 1 identity. Stage 2 cards display real related-query rows. No measured page/viewer overflow, inspected controls below 44px or runtime/hydration errors; 200% root-text reflow passed. Synthetic photos are a uniform test raster and do not establish real photographic quality.

Corrected explicit modal focus cycling after Shift+Tab testing and capture timing after a desktop screenshot showed related content still loading. Settled screenshots wait for related results; deliberate related/image loading have separate evidence. Final lint/types/150 unit-PostgreSQL tests, migration-derived type drift, production browser suites (23 unconfigured passes/27 intentional skips; 44 fixture passes/6 intentional skips) and production builds passed. Normal build restored; temporary resources closed.

Provider Auth/PostgREST/Storage/SMTP, real-device/network, full screen-reader/WCAG and reviewed translations remain pending. No new domain workflow, schema or private-data exposure. No live mutation, commit or deployment. Stop after Stage 3; proposed authentication/account UI review requires a new instruction.

## Historical Stage 2 record

2026-10-11, Asia/Colombo. Result: passed for the authorized browsing/search/filter/card scope. [Implementation, changed files and detailed evidence](docs/design/stage-2-2026-10-11/implementation.md).

Inspected actual isolated production screenshots at 360, 390, 768, 1280 and 1440px against the established Stage 1 identity. Search/filter placement, one-column phone cards, two-column tablet grid, three-column desktop grid, 4:3 images, prominent asking prices and keyboard/modal behavior passed. No measured horizontal overflow, undersized inspected controls or runtime/hydration errors. Populated fixtures use a uniform test raster, not real vehicle photography.

Corrected mobile filter actions covering fields, desktop Apply wrapping and redundant clipped price placeholders. Final captures use an independently scrolling filter body with visible actions. Reviewed chips/reset, missing-photo, empty/no-match, delayed skeleton and outage states. Automated 200% root-text reflow at 360px passed. E2E: unconfigured 21 passed/17 intentional skips; fixtures 35 passed/3 intentional skips. Lint/types/136 unit-PostgreSQL tests, database type drift and production builds passed; normal build restored.

Provider Auth/PostgREST/Storage/SMTP, reviewed translations, real-device/slow-network and full screen-reader/WCAG acceptance remain pending. No live project write, commit or deployment. Next UI stage: details, only after new authorization.

## Historical Stage 1 record

Date: 2026-10-10 (Asia/Colombo). Scope: design system and public homepage only. Previous broader work/report preserved in docs/design/stage-1-2026-10-10/prior-design-qa.md.

## Comparison target and normalization

- Source visual truth: docs/design/audit-2026-10-10/concepts/01-premium-automotive-minimalism.png, the existing selected option 1.
- Rendered implementation: isolated normal production app on loopback port 3102, closed after QA; the user's localhost:3000 development preview remains available.
- State: guest, English, light mode, zero approved listings. Populated/transport-failure captures are explicitly isolated test fixtures, not the reference comparison state.
- Source: 1487?1058 pixels. Proportionally normalize to 1440?1025, crop one bottom pixel. Implementation screenshot: 1440?1024 CSS/pixels, deviceScaleFactor 1. No browser chrome/device frame.
- Final implementation screenshot: docs/design/stage-1-2026-10-10/screenshots/normal-home-1440-viewport.png.
- Full combined input: docs/design/stage-1-2026-10-10/comparison-v2.png, source left / implementation right.
- Focused combined input: comparison-hero-v2.png in the same folder, showing heading, supporting copy, labelled input and all search/selling/browse actions at readable density.
- Additional actually viewed evidence: mobile-home-final-focus.png, tablet-home-focus.png, fixture-cards-mobile-focus.png, loading-mobile-focus.png, error-mobile-focus.png, screenshots/mobile-menu-360.png and text-scale-focus.png.

## Comparison history and findings

### Initial pass ? fix required

[P2] The phone's secondary selling action had a shorter right edge than the full-width search action. Location: HomepageHero action row, 360px. Evidence: mobile-home-focus.png and comparison-v1/comparison-hero-v1. Impact: inconsistent alignment weakened the primary/secondary action grouping on the small screen. Fix: w-full below sm, retaining intrinsic desktop width.

### Final pass ? accepted

The production mobile recapture aligns both actions with the input edges; no overlap or clipped action text. Reviewed normalized full/focused comparisons and the actual phone/tablet/card/state/menu captures. No remaining actionable P0/P1/P2 issue. The full desktop footer is below the 1024px viewport, with normal scrolling; all required footer destinations still resolve. Enlarged text increases vertical scrolling but keeps controls/reflow available.

## Required fidelity surfaces

| Surface | Evidence and assessment |
| --- | --- |
| Fonts/typography | Existing local Geist retained. Hero scale 30px at 360 to 44px wide, 1.15 line height and restrained tracking; body 16px/1.6, UI/support 14px, section/asking price 24px. Browser glyph inspection proves custom local Noto Sans Sinhala/Tamil render script names. Only English UI is offered. No tiny uppercase labels; headings/prices remain distinct. |
| Spacing/layout rhythm | Existing 4px spacing/8px radius and minimal elevation retained. Shared 80rem container, 20/32/40px gutters, search-first phone order, full-width phone selling action, split wide hero and compact supported-category/recent/guide sections. Native drawer is the only modal; no new sticky UI. |
| Colors/tokens | Selected background/surface/charcoal/green/gold palette retained; separate control border and semantic danger. Primary/white 6.85:1, muted/base 5.49:1, control/surface 3.18:1 and base 3.01:1, danger/surface 6.57:1. Gold is a restrained marker, not small low-contrast text. |
| Images/assets/icons | Reused labelled 1536?1024 illustrative WebP, correctly framed 3:2 with the full compact car visible. No gradient/fade, new fake listing photo, drawn raster substitute or invented logo. Existing Lucide icons remain functional navigation/search/category/feedback cues. Approved photos retain their controlled existing path; the flat fixture raster is explicitly test-only. |
| Copy/content | Short discovery headline/description, labelled make/model search, Find vehicles and clearly coming-soon selling destination. Supported passenger cars plus unavailable-category note. Six recent eligible rows or truthful states. Required three-step guide ends with Bid when available and explains unavailability; no fabricated bids/badges/statistics. |

## Intentional adaptations from the older raster

- The brief requires a selling action in the hero and Bid when available as the third step; the old image lacks that CTA and instead says Plan an inspection. Implement the current authorized brief while preserving its overall art direction.
- Keep the existing accessible search label, complete footer information and no-account-needed explanation. Use the restrained responsive heading instead of the raster's oversized type.
- Clean framed illustration replaces the source fade to honor the no-gradient constraint. The restrained accent divider remains presentation only.
- No pixel-identity claim: appropriate responsive/product constraints take precedence. The existing browse/detail/auth visual changes were preserved, not redesigned by this stage.

## Executed visual and interaction checks

- Normal and populated homepages at 360, 390, 768, 1280, 1440px: zero horizontal overflow and no inspected primary/header/footer targets below 44px. Search button ends at y=393.3/393.4/346.1/362.8/362.8px respectively, inside normal first-view height.
- 14 normal/populated/empty/error observations plus actual loading screenshots at 360/1440px. Skeletons captured while test-only listing requests were delayed, then six approved fixture cards rendered. Empty/error cases use controlled transport, not production data mutations.
- Native mobile menu/Escape focus restoration passed; all existing shell/search/selling/footer/private-access E2E behavior passed. At 200% root text size on 360px, no horizontal overflow; inspected text-scale-focus.png. This is focused reflow, not a full browser zoom/screen-reader audit.
- Zero hydration console/page errors and zero requests to Google font hosts. CSS glyph evidence is in font-checks.json; state/geometry evidence in final-checks.json; palette evidence in contrast-checks.json.
- npm.cmd run check passed lint/strict types/126 tests; final lint and db:types:check passed. Production E2E: unconfigured 20 passed/10 intentional fixture skips; fixtures 28 passed/2 intentional unconfigured skips. Normal/unconfigured/fixture builds passed and normal configuration was restored.
- 44 protected file hashes remained unchanged. All temporary test servers/proxy/PostgreSQL resources were closed; no live writes or deployment.
- After clarifying the footer's English-available/Sinhala-Tamil-planned wording, final lint/build and five normal viewport recaptures passed. Browser wording verification and footer-focus.png review passed; final-footer-checks.json records this final text-only check. Functional E2E/state checks preceded this copy refinement.

## Known limits and follow-up polish

- [P3] Real-device/slow-network and screen-reader review, reviewed full Sinhala/Tamil translations and a future approved editorial photograph can refine the experience. These are not claims of current provider/release acceptance.
- Actual Supabase Auth/PostgREST/Storage/SMTP lifecycle acceptance remains pending; the normal UI's zero approved listings is only an observed public state.
- In-app browser helper failed in this Windows session; actual rendered verification used the established authorized isolated Chrome fallback. Browser extension injection into nested elements remains a profile-side issue.

## Implementation checklist

- [x] Reuse the selected visual and existing project/assets/services.
- [x] Scope implementation to shared design foundations and homepage.
- [x] Resolve mobile action alignment and recapture the final production UI.
- [x] Inspect five widths, populated/empty/loading/error/menu and enlarged text.
- [x] Validate local script fonts, contrast, keyboard/search and regressions.
- [x] Record source/assets/files/results and preserve prior work.
- [x] Restore the normal build and initial generated references; preserve the user's preview.

final result: passed
