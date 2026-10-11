# UI redesign Stage 3 — vehicle details

2026-10-11, Asia/Colombo. Scope: the existing vehicle details experience within development Phase 2. Implementation, final regression checks and rendered QA complete. Stopped after Stage 3. This does not authorize the seller-management development phase.

## Verified starting point and design

Read instructions, README, architecture, decisions, roadmap, phase log, database and Stage 1/2 design evidence. Git began clean; both UI stages were present. Captured the existing detail page at 360/1440px using isolated fixtures before source edits. Reused the selected Premium Automotive Minimalism palette, local fonts, semantic container/type/spacing tokens, shared header/footer, Button, VehiclePhoto, VehiclePrice, AuctionInformation and Stage 2 grid/cards.

- Photo-first mobile layout and balanced two-column desktop. Compact summary uses actual manufacture year, fuel, transmission, mileage, district and registration year when available. No invented grade, town, colour or seller data.
- Large gallery uses object-contain to retain the full photograph. Previous/next, announced counter, desktop thumbnails, Arrow/Home/End keys and deliberate horizontal touch swipes work without intercepting vertical page scroll. A viewport-filling native dialog supports Close/Escape, inert background, focus restoration and scroll restoration. Only the selected full-size photo is mounted in the viewer; thumbnails use small lazy images. The first main photo is prioritized; later images stay lazy. Loading/failure feedback reuses the controlled photo boundary.
- Prominent exact Seller’s asking price, plus the established truthful bidding-unavailable notice. No bid/buy/sign-in CTA falsely implies a working transaction. No countdown, bid history, reserve or sale-price label. No mobile action bar is needed while transaction features are unavailable.
- Known defects appear early with a restrained danger-colored edge. Seller-declared history distinguishes reported/none-reported/not-stated values. Condition precedes essential specifications on mobile; the longer seller description follows specifications, then display-approval/inspection guidance and bounded real related vehicles. Missing description is omitted; missing specifications say Not stated. No seller category, verification badge, rating or personal contact information is fabricated.
- Browse cards carry canonical filter/sort/page context in an optional from query parameter. Server validation permits only the existing catalog route/schema, rejects ambiguous or unsafe destinations and defaults to /vehicles. Direct and homepage detail links continue to work without this parameter. Breadcrumb/back navigation stays simple on phones.
- Related vehicles reuse the existing five-row query, exclude the current row and show at most four Stage 2 cards. No-result/error sections are omitted. A local Suspense boundary lets the main detail content render without waiting for related results.

## Data, access and performance

Supabase query code, DTOs, migrations, RLS/column privileges, private Storage delivery, Auth and generated database types are unchanged. The visibility layout still resolves approved/already-published access before streaming a response, preserving true 404s for hidden/removed/unknown slugs. No private seller join or auction data is introduced. Metadata/new UI copy lives in the typed English dictionary; translations remain planned.

The detail-specific child skeleton is redesigned, but the initial visibility lookup intentionally precedes its stream. Captured loading states cover actual image and related-query loading; no claim that an initial unvalidated detail skeleton bypasses the 404 gate. Full-screen means a viewport-filling accessible dialog, without changing browser fullscreen permissions.

Checked official [Next Image](https://nextjs.org/docs/app/api-reference/components/image), [native dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog), [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) and [Playwright route cleanup](https://playwright.dev/docs/api/class-page#page-unroute-all) documentation. No new dependency, generated fictional vehicle image, external image host or live database write.

## Files

Created under src/features/vehicles/: navigation.ts, related-vehicles.tsx, vehicle-condition.tsx, vehicle-description.tsx, vehicle-details-skeleton.tsx, vehicle-price-panel.tsx and vehicle-trust-information.tsx. Created tests/unit/vehicle-navigation.test.ts, tests/e2e/vehicle-details.spec.ts and scripts/details-design-qa.mjs, plus this report/PNG/JSON evidence.

Modified: src/app/vehicles/[slug]/page.tsx and loading.tsx; vehicle details-page/gallery/highlights/specifications/photo/price; browse-page/card/grid only to carry return context; src/i18n/dictionaries/en.ts; tests/e2e/marketplace.spec.ts; package.json (qa:details script only); README, architecture, product requirements, decisions, roadmap, phase log and root design QA. Initial generated next-env development references restored after verification. Homepage composition, query/filter services, account workflows, SQL, lockfile and database types remain unchanged.

## Executed final verification

| Check | Actual result |
| --- | --- |
| npm.cmd run check | Final lint, strict TypeScript and all 150 Vitest/PostgreSQL tests across 9 files passed, including description order and explicit gallery focus cycling. |
| npm.cmd run db:types:check | Migration-derived types match. |
| PLAYWRIGHT_CHANNEL=chrome npm.cmd run test:e2e | Passed: 23 unconfigured passes / 27 intentional skips; 44 fixture passes / 6 intentional skips. Final fixture .last-run reports passed with no failed tests. |
| Production builds | Unconfigured/fixture/QA/normal-restoration builds passed. |
| npm.cmd run qa:details | Final five detail/full-screen widths, 16 controlled states and 200% root-text reflow passed. 22 recorded observations; zero overflow, undersized inspected gallery targets or recorded runtime/hydration errors. Settled captures wait for related results. |

New browser checks verify actual Chromium touch input, gallery keyboard/native modal focus, contain-fit images, selected-image request budget, safe filter-context return, disclosure order, unavailable bidding, absent specs/photos and failed-image fallback. Existing public visibility, raw-media denial, Auth/cache/hydration, browsing/search/filter/sort/pagination and homepage tests remain. Skips are configuration-specific, duplicate capture or desktop-only touch exclusions.

The strengthened Shift+Tab browser test found that native dialog behavior did not cycle from Close to the last gallery control as intended; explicit Tab/Shift+Tab cycling fixed it and the final desktop/mobile tests passed. Capture harness issues were also corrected: delayed image handlers needed wait-mode removal, each transport case needed a fresh context to prevent decoded-image cache bypass, and settled screenshots needed to wait for related results. These harness corrections do not change production behavior. The final normal build is restored and temporary QA resources closed by the harness. Run npm run qa:details separately from builds/E2E with loopback port 3104 free; --before captures a baseline.

## QA observations and known limits

Actually inspected initial mobile/desktop screenshots and final populated detail viewports at 360, 390, 768, 1280 and 1440px, full-screen phone/desktop, focused condition/specifications and single/missing/loading/failed-photo, unavailable-query and hidden-404 cases. Familiar tokens, larger price, quiet sections and no nested decorative cards maintain the approved direction. Asking price is visible in the initial phone viewport; tablet keeps the photo-first vertical composition, desktop uses balanced columns. Known defects precede specifications; long seller text follows them. No measured page/viewer overflow, inspected gallery targets below 44px or focus-restoration failures. Detailed measurements: normal-checks.json.

Representative rendered evidence: [phone](screenshots/normal-details-360-viewport.png), [desktop](screenshots/normal-details-1440-viewport.png), [phone gallery](screenshots/fullscreen-360.png), [condition](screenshots/condition-360.png), [specifications](screenshots/specifications-360.png), [photo loading](screenshots/image-loading-360.png), [failed photo](screenshots/image-error-360.png) and [hidden 404](screenshots/not-found-360.png).

Synthetic fixture cars and a uniform-color test raster exercise real isolated PostgreSQL/RLS and simulated provider transport. They do not prove real photographic quality or provider hosting, and never populate a normal app/project. Actual Supabase Auth/PostgREST/Storage/SMTP, real-device/slow-network, screen-reader/full WCAG and reviewed Sinhala/Tamil acceptance remain pending. Existing optimized-image cache revocation limits still apply. Auction active/ended states and public seller verification/category cannot be displayed without domain data that does not exist.

No commit, push, deployment, live mutation, seller wizard, bidding engine, payments or admin verification. Next recommendation: review authentication/account UI using existing secure flows, only after a new instruction. Stop after this UI stage.
