# Product requirements

## Purpose and initial market

AutoBid LK will provide an accessible vehicle auction and buying marketplace for Sri Lanka. Start with used passenger cars. Build a real, maintainable application phase by phase; international markets and additional categories are later possibilities, not current scope. Market defaults are LK, LKR and Asia/Colombo.

## Customer experience

- Mobile-first layouts, readable text, large touch targets, short instructions and essential information only.
- Public vehicle browsing without a mandatory account. Authentication and appropriate verification before binding bids or live publication.
- Guided workflows, safe defaults and confirmation before important actions. Clear loading, error, empty and success states as each workflow is introduced.
- English, Sinhala and Tamil coverage; localization-ready copy begins in Phase 0, complete coverage in Phase 7.
- Work on affordable smartphones and slower mobile networks. Keep scripts and assets small; avoid unnecessary dependencies and third-party runtime font requests. The selected Phase 2 redesign uses one small, locally hosted variable font.
- Accessibility includes semantic landmarks/headings, keyboard use, visible focus, contrast and reduced-motion support.
- Never simplify away security or show invented marketplace activity and verification claims.

## People and permissions

Guests browse public data. Buyers save vehicles, place verified bids and track purchases. Sellers create listings, manage approval/auction status and completed sales. Verified dealers participate as commercial buyers. Admins review identities/listings and manage users, auctions, disputes and operations. A person can buy and sell using the same account; permissions are enforced server-side and in database policies, never accepted from client claims.

## Seller workflow

The listing wizard has exactly five customer-facing steps:

1. Your Vehicle
2. Condition & Location
3. Add Photos
4. Set Your Price
5. Review & Submit

Save drafts and validate each step. Use plain explanations and safe defaults instead of exposing complex auction configuration. Identity and vehicle ownership verification follow submission and precede publication. Rejections need clear reasons and a correction path.

## Domain modules

Authentication/profiles; vehicle catalog/discovery; seller listing/drafts; seller/vehicle verification; auction lifecycle; secure bidding; notifications/watchlists; winner/purchase workflow; moderation/audit logging; localization/PWA. See the roadmap for implementation order.

## Financial and auction integrity

Use exact integer money units; chosen unit is currency minor units (LKR cents). Display readable Sri Lankan LKR formatting through centralized formatters when prices exist. Never compute money using floating point. Design safely for PostgreSQL bigint precision.

Bidding must validate approved status, authenticated eligible bidder, server-side time, increment/amount and self-bidding. Accept atomically under PostgreSQL locking, protect duplicate submissions and preserve an auditable record and consistent winner. Realtime broadcasts confirmed results; browser countdowns are informational. Auction closure, reserve rules and anti-sniping require tests.

Use least-privilege RLS, server-side ownership/role checks, private identity/registration storage, controlled approved photo publication, rate limiting and sanitized errors/logs. Keep purchase payment tracking separate from processing. No escrow, wallet or automatic sale-proceeds collection without explicit approval and confirmed compliant providers.

## Phase 0 boundary

Deliver only a project foundation and honest starter homepage. No real or mock marketplace data, authentication, Supabase schema, vehicle flows, auctions, seller forms, admin operations or payments. Full language support and PWA behavior remain future work.
