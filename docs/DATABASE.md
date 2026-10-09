# Database foundation and public marketplace

Versioned migrations are `202610090001_auth_foundation.sql` (private accounts) and `202610090002_public_marketplace.sql` (minimal public catalog/media/private photo bucket). Both execute successfully in isolated PostgreSQL tests. **Neither was applied to a real Supabase project during this work.** Public settings now exist, but read-only REST checks returned PGRST205 for known tables, including profiles, vehicles, vehicle_listings and vehicle_media. The app handles this safely. No production listings, operator approval, remote bucket provisioning or auction schema was created.

## Relationships

| Table | Key and relationship | Purpose |
| --- | --- | --- |
| profiles | id UUID PK -> auth.users.id, cascade on deletion | One private profile per account; optional display name, locale and timestamps. |
| dealer_profiles | user_id UUID PK -> profiles.id, cascade | Optional one-to-one business profile and protected verification state. verified_by -> auth.users.id, set null on deletion. |
| admin_grants | user_id UUID PK -> profiles.id, cascade | Separate trusted admin membership. granted_by -> auth.users.id, set null on deletion; reason and creation time retained. |

Buying and selling do not require separate accounts or role rows. Dealer status is pending/verified/rejected. Admin access requires an existing grant; editable user metadata never creates one.

## Constraints, indexes and timestamps

Profile names are null or 2–80 trimmed characters; locales are en/si/ta. Dealer business names are 2–120 characters. Verified status requires verified_at, and nonverified statuses require its absence. Grant reasons are 2–200 characters. All rows have created_at; mutable profile/dealer rows have updated_at maintained by a trigger. Primary keys already index ownership lookups; partial indexes cover nullable verified_by/granted_by foreign keys. No speculative indexes or future tables are added.

An AFTER INSERT Auth trigger creates each profile. Its security-definer function uses an empty search_path and fully qualified table names. Only a bounded display name is taken from user metadata; invalid names become null, and role/admin/dealer claims are ignored. Existing Auth users receive profiles during migration. Clients cannot directly create/delete profiles or call trigger functions.

## Privileges and RLS

RLS is enabled on all three Phase 1 public tables. Default PUBLIC/anon/authenticated table privileges are revoked before deliberate grants.

| Operation | anon | authenticated owner | another customer, including an admin grant holder | trusted service_role/database operator |
| --- | --- | --- | --- | --- |
| Read profiles/dealer profiles | Denied | Own rows only | Other rows hidden | Privileged access |
| Update profile | Denied | display_name and preferred_locale only | Other rows unchanged | Privileged access |
| Create/delete profile | Denied | Denied; Auth trigger owns provisioning | Denied | Privileged access |
| Request dealer profile | Denied | Own business name, pending defaults | Denied | Privileged access |
| Edit dealer profile | Denied | Own pending business_name only | Denied | Privileged access |
| Change dealer verification/owner/timestamps | Denied | Denied | Denied | Separately authorized trusted provisioning |
| Read admin grant | Denied | Own grant only | Other grants hidden | Privileged access |
| Insert/update/delete admin grant | Denied | Denied | Denied | Separately authorized trusted provisioning |

Authenticated users receive column-level insert/update grants, not whole-table write grants. RLS checks auth.uid() on both existing/new ownership. An authenticated role without an identity sees no rows. Possessing an admin grant does not grant private-profile moderation access in Phase 1; add any broader access explicitly in Phase 4.

The application never uses an elevated key. service_role is reserved for explicitly authorized trusted operations outside customer paths. An admin account cannot create additional grants through the application or direct customer API.

## Provisioning and migration procedure

Use the included Supabase local configuration and an installed CLI/runtime, or a separately authorized development project. Applying to an existing/live project requires explicit authorization; do not run db push automatically.

For a fresh local development stack, `supabase start` initializes the local services and migrations. For an already running disposable local stack, review and use `supabase migration up --local` to apply pending migrations without resetting data. These CLI operations were not run in this phase because the CLI/runtime were unavailable.

A trusted operator may grant admin membership to an existing confirmed account after separate authorization. Resolve its UUID from Auth and record an explicit reason; do not infer privilege from email domains or signup metadata. Initial provisioning can leave granted_by null to identify a bootstrap grant. Revocation deletes that grant; the next server authorization query observes its absence.

Dealer verification remains a future review workflow. Pending self-submitted business names are never automatically approved. Any trusted fixture/provisioning of verified status must reflect separate authorization and set verified_at; no verification UI or identity documents exist yet.

## Generated types and tests

`npm run db:types` builds the schema in isolated PGlite and derives `src/types/database.ts` from PostgreSQL catalogs. `npm run db:types:check` fails on drift. Types describe schema shapes, not authorization; grants/RLS remain authoritative.

`npm run test:db` executes migrations, triggers, column permissions, ownership, dealer/admin privilege boundaries, marketplace visibility, constraints, photo access and cascading cleanup against actual PostgreSQL. Auth/Storage schemas, listing seeds and UUIDs are synthetic and confined to the test engine. This is meaningful SQL/RLS verification, **not** a completed Supabase deployment/security audit. Actual Supabase/PostgREST/Storage and Auth lifecycle verification remain pending.

## Phase 2 public read model

No existing vehicle schema was found in local migrations or the exposed project's known table names. Two genuinely needed tables are added; no separate vehicle entity, seller draft/document/admin/auction/bid/payment tables are created.

| Table | Relationship | Public content |
| --- | --- | --- |
| vehicle_listings | UUID PK; unique public slug; one row per public catalog listing | Car make/model, manufacture/registration year, district, optional mileage/specifications, exact asking price, declared condition/defects and nullable accident/flood history, display approval/publication status and timestamps. |
| vehicle_media | UUID PK; listing_id FK to vehicle_listings with cascade; unique path and unique listing/position | Raster path, optional alt text, ordered position 0–11, media approval and creation timestamps. |

There is deliberately no public seller/user FK or join to private profiles. Phase 3 must design owned private drafts and Phase 4 publication auditing explicitly; they may reference this public model without adding private documents, NIC/telephone/chassis, reserves or internal notes to public projections. An approved row means reviewed for display, not inspected or guaranteed. Accident/flood null means unknown, never a clean-history claim.

Listings constrain category to car, currency to LKR, price_kind to asking_price, price_minor to bigint 1–1,000,000,000,000 cents (up to LKR 10 billion, within JavaScript safe integers), manufacture year to 1900–2100, registration year to manufacture year–2100 and mileage to 0–3,000,000. Text fields and fuel/transmission values are bounded. District is one of Sri Lanka's 25 districts. URL year filters additionally cap at the current Asia/Colombo year plus one. Exact decimal conversion uses integer/BigInt parsing; public prices never use floating-point arithmetic.

Approval requires approved_at and published_at. Public eligibility requires approved status and a publication time no later than database now(); draft, pending_review, rejected, removed and future rows stay hidden. updated_at reuses the existing trigger. Generated search_text supports combined make/model search. Partial approved indexes cover recent publication, price, year and make/district; PK/unique indexes cover identifiers and media membership/order. Substring search/large exact counts may need measured indexing changes at scale; no production load benchmark is claimed.

## Marketplace privileges and photo publication

| Operation | anon / authenticated customer (including admin grant holder) | Trusted service_role/database operator |
| --- | --- | --- |
| Read listing/facets | Approved, already published rows; explicit safe columns only | Privileged access |
| Read media | Approved media with an eligible parent listing | Privileged access |
| Insert/update/delete listing or media; publish/change price | Denied | Separately authorized trusted operations |
| Read vehicle-photos Storage object | Only approved matching media on an eligible listing | Privileged access |
| Upload/update/delete Storage object | No customer write policy added | Separately authorized trusted operations |
| Read other users' private profile/document data | Phase 1 denial preserved; no document model added | Separately authorized trusted operations |

Column SELECT grants deliberately avoid whole-table grants, so future private columns do not inherit exposure. The security-invoker marketplace_facets() RPC retains RLS, returns at most 100 makes/200 make-model pairs and cannot enumerate hidden listings. Public queries additionally check visibility, validate DTOs, use explicit projections and bounded ranges. Customer roles cannot bypass RLS by requesting a hidden slug.

The migration provisions vehicle-photos as a private bucket, limited to 10 MiB JPEG/PNG/WebP. Media paths must be `<listing UUID>/<safe lowercase filename>.<jpg|jpeg|png|webp>`; each listing has at most 12 ordered slots. Storage SELECT policy matches an approved media row and eligible parent. No public bucket, signed document URL, upload UI or automatic approval exists.

The app delivers photos through `/vehicle-images/<listing UUID>/<photo UUID>`, rechecking both rows and validating MIME/size before returning no-store/nosniff bytes. Next Image optimizes only this local route. **Previously delivered public bytes cannot be recalled.** Its optimized derivatives have a 60-second minimum cache TTL; browser/CDN/hosting behavior may extend retention, so this is not a guaranteed 60-second revocation deadline. Raw route and database reads deny immediately after revocation, but immediate removal of previously cached derivatives requires a cache purge/delivery policy review before launch. Only approved public photos may enter this path.

## Fixture and provider boundary

`tests/fixtures/marketplace.sql` contains 15 explicitly synthetic approved cars, five hidden/future cases and media; it is loaded only by isolated tests/loopback adapter. A flat raster tests delivery. Nothing seeds a normal app/project or falls back to sample data on a query failure. No seed is under supabase/migrations or automatically applied to a real database.

The catalog type generator additionally models integer/bigint/boolean fields, generated columns as unwritable and the current no-argument JSONB RPC. PGlite Storage is a stand-in schema, not the provider's full service. Before release, apply reviewed migrations to an authorized disposable environment and exercise actual PostgREST column grants/RLS, facets, Storage delivery/revocation and existing confirmed-account Auth flows. Applying migrations or creating real approval records was outside this authorized repository work.

[Supabase user-data guidance](https://supabase.com/docs/guides/auth/managing-user-data) and [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security) informed the implementation.
