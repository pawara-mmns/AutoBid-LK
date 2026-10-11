# Stage 5 — Seller listing wizard and seller experience

## Scope and delivery

The user explicitly authorized Stage 5 seller management (development Phase 3), superseding the previous Phase 2-only instruction. Git began clean. Stages 1–4, authentication/private profiles and the approved public catalog were inspected and preserved. No seller-owned drafts or upload workflow existed. The implementation adds private intake alongside the public read model rather than extending public grants with private fields. No live schema, account, upload, production data, commit, push or deployment was changed. Stop after Stage 5.

## Five steps and dashboard

1. **Your Vehicle:** car-only category, searchable brand/model suggestions filtered by brand, an explicit Other fallback, year, separate registration choice/year, fuel/transmission/mileage. Changing brand clears the prior model.
2. **Condition & Location:** district/town, three condition levels and separate accident/flood/mechanical/finance yes/no/not-sure disclosures. Relevant details and repair disclosures are required; optional colour/service/repair/previous-owner information stays secondary.
3. **Add Photos:** front/back/interior/dashboard plus extra/damage. Camera/gallery inputs, upload progress, retry, private thumbnails, deletion, cover and earlier/later ordering. Four guided views are required; up to 12 photos. Uploads continue while editing earlier steps.
4. **Set Your Price:** exact LKR expected/private minimum/optional Buy Now, readable formatted preview and 1/3/7-day preference (default 3). Minimum <= expected <= optional Buy Now. No active auction or invented fee rate.
5. **Review & Submit:** editable summaries/photos, validated account email, phone/contact choice, self-declared ownership, intake terms/accuracy. Typed phone remains unverified. Protected submission validates the persisted record and actual images, then makes an idempotent pending transition. Confirmation explains remaining checks and links to My Vehicles.

My Vehicles reads actual owned rows, 25/page with bounded pagination. It shows cover, make/model/year, expected price, Sri Lankan update date and genuine Draft or Submitted for Review explanations. Drafts resume the saved step; pending records expose only locked details. No forged review result, verification badge, publication or auction is shown. The public seller introduction/header/hero/account links now lead to these real routes, without redesigning the completed public pages.

## Persistence, security and Storage

The ordinary request-scoped Supabase SSR client performs all operations. Guards/actions/photo handlers independently validate confirmed non-anonymous identity. Narrow SQL RPCs derive the owner from Auth, lock records and reject direct table writes, ownership/status assignment and stale revisions. Debounced 800ms saves serialize/drain changes and persist incomplete details/prices/last step. Save failures retain form values and offer retry; conflicts offer an explicit reload. Ordinary links flush changes and dirty full-page exits warn. No private data is stored in browser storage; guests sign in before entering details.

Three new migrations create private owned intake, private photo metadata/bucket/quotas and final submission validation. Expected/minimum/Buy Now use dedicated bounded integer-cent columns. The existing public tables, explicit public projections, visibility policies and approved image delivery are unchanged. There is no private intake join or customer publication privilege. SQL requires complete allowed fields, consistent prices and four guided objects; server submission independently decodes their actual bytes. Repeated creation/submission is idempotent, and pending rows/photos are immutable to the customer.

`seller-draft-photos` is private with owned reserved-path INSERT, owned SELECT and draft-only DELETE. There is no UPDATE/upsert policy. Uploaded metadata does not certify content: direct owner APIs are untrusted. App uploads/previews/final submission fully decode raster bytes, reject malformed/SVG/animation/oversize inputs, cap work at 24MP and use metadata-free maximum-1600px JPEGs. Preview URLs authorize each request and use no-store/nosniff/no-referrer with unoptimized images to avoid shared private image caches. Quotas cap 12 photos/draft, 60 upload attempts/hour/owner, 25 unfinished drafts and 20 creations/24h. No elevated credentials are used. Future approved publication must revalidate content and ownership independently.

## Incremental verification

| Milestone | Gate executed before proceeding |
| --- | --- |
| 5.1 foundation | Generated migration types, strict types/lint and 8 actual PostgreSQL ownership tests passed. |
| 5.2 wizard | Strict types/lint and 17 schema/PostgreSQL checks passed; corrected a radio ARIA warning and named save-loop recursion. |
| 5.3 photos | Types/lint and 15 photo-decoding/SQL checks passed, including owner Storage isolation, cover/order and deletion. |
| 5.4 pricing/submission | Types/lint and 35 schema/image/SQL checks passed; idempotent pending transition and private prices verified. |
| 5.5 completion | Full unit/SQL, seller browser, public/Auth regressions and visual evidence recorded below. |

Actual final checks:

- `npm run lint`: passed with zero warnings.
- `npm run typecheck`: passed.
- `npm run test`: **191 passed, 12 files**, including actual isolated PostgreSQL migrations/RLS and bounded photo/mutation request bodies.
- `npm run db:types:check`: migration-derived types matched.
- `npm run test:e2e:seller`: **14 passed**, production desktop/mobile checks cover brand/Other, guest gating, partial autosave/reload/Back/resume, network retry, stale windows, four private photos, malformed file rejection/deletion, exact private pricing, two clicks on submission, locked state, cross-account 404s and public privacy.
- `npm run test:e2e`: **25 unconfigured passed / 51 intentional skips; 48 marketplace passed / 28 intentional skips; 14 controlled Auth passed**. Skips are environment-specific suites, not claimed acceptance. Ordinary builds were restored afterward.
- Production builds passed in the runners and normal configuration was restored. `git diff --check` passed; generated historical captures and next-env references are restored to their clean starting versions after verification.

Initial focused browser runs caught a selector matching Next's route announcer and, after adding a loading boundary, a streamed 200 for inaccessible private IDs. The selector is scoped to main; a cached authorized listing layout now runs before child loading and actual cross-account 404 checks pass. Capture review caught stale post-navigation screenshots; waits now assert the dashboard/locked screen and scroll lazy images into view before recording. Completion retries preserve cover; owner quota counters survive removed reservations. These issues were corrected, not waived.

## Visual evidence

`checks.json` and `screenshots/` contain **64 full production captures** at **360, 390, 768, 1280 and 1440px**: public introduction, empty dashboard, required-field validation, all five steps, empty/uploaded photos, confirmation, actual dashboard and locked submission. Additional 360px checks cover keyboard focus, 200% text, Other-model entry and script/long-copy stress. No measured horizontal overflow, target below 44px or runtime/hydration error was recorded. Geometry treats clickable labels as targets for radio/checkbox/file controls. Manual review checked mobile registration/damage fields, photos, review/private prices, dashboard, Other entry and tablet locked summaries.

All account/listing/photo data in these captures is synthetic and isolated. The pale-green raster is the existing test image, not a real vehicle photo. Script stress injects existing Sinhala/Tamil sample words and longer labels only for wrapping checks; it is not a translated UI or a translation-quality claim.

## Files created

- `src/app/seller/vehicles/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `[id]/layout.tsx`, `[id]/loading.tsx`, `[id]/photos/route.ts`, `[id]/photos/[photoId]/route.ts`.
- `src/features/seller-listings/`: `actions.ts`, `queries.ts`, `page-data.ts`, `schema.ts`, `use-draft-save.ts`, `fields.tsx`, `seller-listing-wizard.tsx`, `wizard-progress.tsx`, `vehicle-information-step.tsx`, `condition-location-step.tsx`, `vehicle-photos-step.tsx`, `pricing-step.tsx`, `review-submit-step.tsx`, `dashboard.tsx`, `create-draft-button.tsx`, `image-validation.ts`, `photos.ts`, `photo-routes.ts`, `request-body.ts`.
- `src/i18n/dictionaries/seller-en.ts`.
- `supabase/migrations/202610110001_seller_foundation.sql`, `202610110002_seller_photos.sql`, `202610110003_seller_submission.sql`.
- `scripts/seller-fixture.mjs`, `run-seller-e2e.mjs`, `seller-design-qa.mjs`.
- `tests/integration/seller-rls.test.ts`, `tests/unit/seller-schema.test.ts`, `seller-images.test.ts`, `tests/e2e/seller-experience.spec.ts`.
- This report, `checks.json` and Stage 5 screenshots.

## Files modified

- Authentication safe returns/guard destinations and Proxy: `src/features/auth/redirects.ts`, `guards.ts`, `src/proxy.ts`.
- Navigation/current availability copy: `src/components/layout/site-header.tsx`, `mobile-navigation.tsx`, `src/features/marketplace/homepage-hero.tsx`, `information-page.tsx`, `src/features/profiles/account-view.tsx`, `src/i18n/dictionaries/en.ts`, `get-dictionary.ts`.
- Database type generator/generated types, explicit pinned Sharp dependency and scripts: `scripts/generate-db-types.mjs`, `src/types/database.ts`, `package.json`, `package-lock.json`.
- Isolated transport/policy fixtures and current seller-heading regression: `scripts/auth-fixture.mjs`, `tests/fixtures/storage-schema.sql`, `tests/e2e/marketplace.spec.ts`.
- `AGENTS.md`, `README.md`, `docs/PRODUCT_REQUIREMENTS.md`, `ARCHITECTURE.md`, `DATABASE.md`, `DECISIONS.md`, `ROADMAP.md`, `PHASE_LOG.md`.

## Remaining acceptance and next stage

No real project migration was applied. Actual Supabase Auth/SMTP/PostgREST/Storage acceptance remains pending: this environment lacks a running disposable provider stack, and real project writes were not authorized. Isolated PostgreSQL executes real policies/transactions; synthetic Auth and object/API transport do not validate hosted configuration, token revocation, email delivery, bucket service defaults or provider limits. Review/apply all five migrations to a separately authorized disposable local/development environment and verify the complete seller/Auth/Storage flows there before release.

Only English is available; reviewed Sinhala/Tamil translations, physical phone camera/gallery/device tests, broader assistive-technology/user testing, retention/orphan-object cleanup, hosting body limits and slow-mobile deployment performance remain release work. Draft state is recoverable after successful database saves; browser process termination/offline unsaved changes cannot be guaranteed. No SMS ownership/admin approval/publication workflow or fee schedule exists. Submitted listings intentionally stay private and pending.

Next recommended feature stage is **Admin & Verification**, after provider acceptance and new authorization. It must review identity/ownership, record auditable decisions/reasons, support correction requests and control approved publication. Bidding, winners, payments and escrow remain out of scope. Stage 5 stops here.
