# UI redesign — Stage 2: vehicle browsing

2026-10-11, Asia/Colombo. Complete within authorized Phase 2; stop before UI Stage 3 or development Phase 3.

## Starting point and implementation

Read project instructions/README/architecture/roadmap/phase log/decisions/database design and Stage 1 evidence; inspected current UI, queries and tests. Git started clean. Stage 1 established tokens, local fonts, navigation and homepage sections, retaining prior browse/detail work. Reused Premium Automotive Minimalism, shared container, palette, typography, controls and spacing. No dependency or second identity.

- Compact heading, direct copy, input search icon, clear button with focus restoration, mobile search keyboard hint and Enter submission.
- Mobile Filters immediately follows search. Full-height native dialog keeps Close and Apply/Clear all visible around independently scrolling fields. Selections remain open. Clear all clears the draft including search; Apply commits it. Desktop uses the same form in a 264px sidebar. Brand changes clear the dependent model and update options from bounded approved facets.
- Vehicle type, brand, model, district, exact LKR price and year ranges are initially visible. Only used passenger cars are selectable. Fuel, transmission and mileage are collapsed unless active. Typed English dictionaries hold all new text.
- Removable filters preserve other selections/sort and reset pagination; removing brand clears model. Clear filters resets the URL. Explicit GET sorting retains four SQL orders and deterministic ID tie-breakers. Refresh/Back restore applied results and controls.
- Cards have one keyboard-accessible full-card link, 4:3 controlled photo/fallback, make/model/year/district/mileage, prominent exact asking price, genuine display-approval wording and View details. Approval is not inspection. No auction, final-sale or buy-now information is invented. Grid rows align heights; phones use one column, tablet two, large desktop three. Browse-specific image sizes reduce excessive downloads.
- Invalid URL input shows correction feedback and safe-default results rather than suggesting a database failure. Existing sanitized empty/outage feedback is retained; skeletons follow the revised card structure.

## Queries and security

Existing schema/service adds allowlisted fuel/transmission equality and inclusive integer mileage ranges (0–3,000,000 km). Duplicate, malformed, fractional, negative, reversed or excessive values fail to safe defaults. Unknown keys are discarded; page-size/visibility overrides cannot affect queries. Text/year/district/sort/page/exact-money bounds remain.

No migration, relationship change, extra projection or database write. Cookie-free public reads, explicit safe columns, approval/publication gates, RLS, approved private-photo access, 12-row pages and capped facets remain. Example: `/vehicles?make=Toyota&district=Colombo&fuel=hybrid&maxMileage=45000&sort=price-asc`. Existing make URLs are retained. Checked official [Supabase equality](https://supabase.com/docs/reference/javascript/eq), [range](https://supabase.com/docs/reference/javascript/range) and [Next Image](https://nextjs.org/docs/app/api-reference/components/image) APIs.

## Files

Created: vehicle-search-input.tsx, vehicle-filter-form.tsx, vehicle-active-filters.tsx and vehicle-sort.tsx under src/features/vehicles/; tests/e2e/browse-design.spec.ts; scripts/browse-design-qa.mjs; scripts/capture-browse-before.mjs (initial evidence); this report, JSON measurements and PNGs.

Modified: src/app/vehicles/page.tsx; src/components/ui/modal-drawer.tsx; vehicle browse-page/search-schema/queries/search/filters/card/grid; src/i18n/dictionaries/en.ts; unit vehicle-search tests; e2e foundation/marketplace tests; package.json (qa:browse script only); README, architecture, roadmap and phase log. Homepage composition/six-row query and detail/gallery composition remain, receiving only shared search/card/skeleton improvements. Auth, Supabase clients, SQL, database types and lockfile are unchanged. Generated next-env imports are restored to their starting development references.

## Executed verification

| Check | Result |
| --- | --- |
| npm.cmd run check | Lint, strict TypeScript and 136 Vitest/PostgreSQL tests in 8 files passed. |
| Final lint / typecheck | Passed after application/browser refinements. |
| npm.cmd run db:types:check | Types match migrated catalog. |
| PLAYWRIGHT_CHANNEL=chrome npm.cmd run test:e2e | Unconfigured 21 passed / 17 intentional skips; fixture 35 passed / 3 intentional skips. |
| Production builds | Unconfigured, fixture, QA and restored normal builds passed. |
| npm.cmd run qa:browse | 12 controlled states at 360/1440px, five-width decoded-image captures and 200% root-text reflow passed; services closed and normal build restored. |

Behavior checks cover all sorts, basic/advanced filters, dependent models, draft clearing, removal/reset, refresh/Back, pagination, keyboard card navigation, hidden listings/photos, homepage and guest Auth/cache/hydration regressions. Fixture requests use the established real PostgreSQL/RLS adapter, not real Supabase hosting. Configuration-specific and duplicate-mobile-capture skips are explicit.

Initial failures were test tuple typing, stale heading assertions and an alert locator matching Next's announcer; corrected and full suites passed afterward. Visual review found mobile footer overlay, desktop Apply wrapping and clipped redundant placeholders; fixed and recaptured. An npm exec QA invocation selected an unnecessary Node package; stopped it and used the repository script with installed Node 24. Dependencies/lockfile did not change.

## Rendered evidence and limits

Actually viewed the approved concept, initial mobile/desktop UI, final populated viewports at 360/390/768/1280/1440px, phone card, tablet/desktop grid, mobile dialog, chips, empty/no-match, loading and controlled outage screenshots. Sidebar/cards extend the approved homepage direction; no pixel-match claim.

fixture-checks.json and unconfigured-checks.json record no horizontal overflow, no inspected controls below 44px, one link per card, 4:3 images and no captured hydration/runtime errors. Card widths: 320/350px phones, 342px tablet, 288px desktop. state-checks.json records no overflow/runtime errors for populated/empty/outage/loading/no-match/filtered states and enlarged text. Loading observations count settled cards; loading PNGs show the actual earlier skeleton.

Fixtures are synthetic; the uniform-color raster is not a real car photograph. Missing-photo rows exercise the real fallback. Initial normal UI showed zero approved vehicles. No real project was seeded or changed. Sandbox/in-app browser failed to start; approval-reviewed shell and isolated headless Chrome provided rendering. The existing user development server was preserved.

Actual Supabase Auth/PostgREST/Storage/SMTP acceptance, full reviewed Sinhala/Tamil, real-device/slow-network, full screen-reader/WCAG and production search/count/cache-revocation acceptance remain pending. No commit, push, deployment, live write, seller wizard, bidding or payment changes. Next recommended UI stage: vehicle details, only after new authorization.
