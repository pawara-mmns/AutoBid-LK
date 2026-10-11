# Design QA — AutoBid LK, option 1

Date: 2026-10-10 (Asia/Colombo).

## Comparison target and evidence

- Source visual truth: docs/design/audit-2026-10-10/concepts/01-premium-automotive-minimalism.png.
- Implementation: http://127.0.0.1:3101/, captured in isolated Chrome after final changes.
- State: English public homepage, guest, light mode, zero approved listings. Fixture screenshots are explicitly synthetic and are not used as the empty-state reference comparison.
- CSS viewport: 1440×1024; deviceScaleFactor 1. Source pixels: 1487×1058. Reference normalized proportionally to 1440×1025, then one bottom pixel cropped. Implementation: 1440×1024 pixels.
- Full-view combined input: docs/design/redesign-2026-10-10/comparison-v2.png, reference left / implementation right.
- Focused combined input: docs/design/redesign-2026-10-10/comparison-search-v2.png. Search, font weights, controls and copy inspected at readable size.
- Final screenshot: docs/design/redesign-2026-10-10/screenshots/normal-home-1440-viewport.png. Full/mobile captures are in the same folder.
- Populated fixture surfaces reviewed: fixture-browse-1440.png, fixture-browse-768.png, fixture-detail-1440.png, plus detail-mobile-focus.png and browse-mobile-focus.png. Their uniform raster is a test transport image, not an actual vehicle photo.

## Comparison history

### Iteration 1

[P2] Desktop section rhythm was too tall. The guide was pushed below the initial view. Evidence: comparison-v1.png and comparison-search-v1.png; the original app viewport is preserved as screenshots/homepage-v1-1440-viewport.png. Correction: reduce desktop hero/category/recent padding, remove the repeated recent browse action, compact empty feedback, shorten guide copy and align the availability note beside the guide on desktop.

[P2] Structural border was too pale to define input/control edges. Palette measurement was 1.27:1 against white. Correction: introduce a separate control-border #85948C token for inputs, selects and outline buttons, keeping structural borders #E0E5E2. Measured control contrast is 3.18:1 against white and 3.01:1 against the base background.

### Iteration 2 — accepted

Inspected the recaptured combined full-view and focused comparisons. The search and image have balanced separate regions, category availability is compact, and the guide is visible in the initial desktop view. Actual guide starts at y=869.8px; all three steps end at y=1012.4px in a 1024px viewport. The full footer is below the viewport. This is an expected adaptation for readable copy and the retained footer links/language availability, not a hidden action. No remaining actionable P0/P1/P2 design findings.

## Required fidelity surfaces

| Surface | Result |
| --- | --- |
| Fonts/typography | Locally hosted Geist matches the intended clean sans direction. Body 16px, support/captions 14px, home heading 44px desktop/30px mobile, prices 24px with tabular numerals. Headings/copy wrap without horizontal overflow. The restrained heading intentionally follows the original brief rather than the generated mock's oversized type. |
| Spacing/layout | Clear search-first mobile order, split desktop hero, consistent gutters, 4px spacing system, 8px base radius, minimal elevation. Earlier vertical-rhythm issue corrected. Two-column tablet/tight-desktop grids and three-column wide grids avoid squeezed prices. |
| Colors/tokens | Exact requested warm white/charcoal/green/gold palette, white surfaces and separate control boundaries. Primary white-on-green contrast 6.85:1; muted text/base contrast 5.49:1. Gold is a small non-text marker/selection color, not small white button text. Hover/active/focus states and reduced-motion CSS retained. |
| Images/assets | A separately generated 1536×1024, 226 KiB WebP shows the full illustrative compact car with clean edges and no fake listing claims. It retains its 3:2 framing on mobile/desktop. Lucide handles standard icons; no raster screenshot is substituted for real page UI. Licensed font and asset provenance are recorded in implementation.md and src/app/fonts/. |
| Copy/content | Direct discovery copy, explicit asking prices, seller-declared condition and publication/inspection distinction. No live bidding, verification claims, invented listings or stats. Selling is clearly future information; the static five-step list is not a wizard. Only English is available. |

## Rendered checks

- Focused capture runs: 30 normal route/width observations and 15 populated fixture observations at 360, 390, 768, 1280, 1440px. Zero horizontal overflow and pageerror events.
- Homepage search is in the initial viewport at all five normal widths; recorded in normal-checks.json.
- Search URL submission, modal Escape dismissal/focus restoration and gallery photo-2 pressed state passed.
- Header/footer actions, enabled primary buttons/inputs/selects checked on home, browse, signup and selling information at 360px: none below 44px high. This is a focused check, not a claim about every inline text link.
- 200% root text-size reflow on those four surfaces at 360px: zero horizontal overflow. Inspected enlarged homepage capture/text-scale-focus.png. Text wraps, and scrolling is expected at enlarged text sizes. This is not a complete browser zoom/screen-reader audit.
- Existing production Playwright suites checked runtime/hydration console errors, guest Auth boundaries, filtering/sorting/pagination, visibility/404, empty/photo fallbacks and gallery behavior: unconfigured 20 passed / 10 intentionally skipped; isolated fixture 28 passed / 2 intentionally skipped. They passed before the last CSS refinements; final build/types/lint and the focused responsive/interaction captures passed afterward.
- npm run check passed lint, TypeScript and 126 Vitest/PostgreSQL tests in 8 files. Final lint/typecheck passed again. db:types:check matched migrations. Normal, unconfigured and fixture builds passed; the normal build was restored after fixture work. git diff --check passed.

## Expected adaptations and follow-up polish

- Clean framed photography replaces the raster's fade to comply with the no-gradient brief.
- Existing accessible search label and complete footer information are retained. Readable caption/support text and smaller display heading take precedence over exact generated typography.
- [P3] A future real editorial photo may replace the illustrative hero when an approved asset is available; do not substitute it into listing media.
- [P3] Further device/network and screen-reader review can refine the experience. This pass does not establish full WCAG or reviewed Sinhala/Tamil support.

## Remaining acceptance gaps

Actual Supabase Auth/PostgREST/Storage/SMTP acceptance remains pending as documented in README/PHASE_LOG. No successful provider sign-in, account creation or email was attempted. Fixture SQL/RLS is real isolated PostgreSQL with stand-in Auth/Storage transport, not the actual hosted provider. No real listing-photo crop dataset or production network/performance benchmark was available. These are existing release gates, not claims of verified features.

## Implementation checklist

- [x] Apply selected design within existing Phase 2 surfaces.
- [x] Preserve services, schema, Auth actions/roles and existing hydration fix.
- [x] Resolve P2 spacing and control-boundary findings, recapture and compare.
- [x] Inspect mobile, tablet, desktop, populated data, forms and enlarged text.
- [x] Record checks, limitations, source assets and phase scope.
- [x] Restore normal build and pre-existing next-env.d.ts content; leave local preview running.

final result: passed
