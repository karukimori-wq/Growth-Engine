# Business Plan Preparation

Status: contract preparation only. Business product functionality is not being added in this change.

Adopted professional-platform-contracts Plan contract from `main`.

## Shared PlanId

Growth Engine recognizes the `professional-platform-contracts` PlanId values:

- `free`
- `pro`
- `business`

The existence of the `business` identifier does not mean Business is currently offered.

## Current availability

- Business availability status: `unavailable`
- Business may also be represented as `preparing` for admin-only planned/in-development visibility.
- Business feature key / flag: `business.cross_app.flow`
- feature flag default: disabled
- public Business entry while unavailable or preparing: hidden
- normal-user Business purchase visibility: hidden
- access policy: fail-closed

Future Business access requires all three conditions:

1. the authenticated workspace has `planId: business`;
2. the Business availability status is `available`;
3. the Business integration feature flag is enabled.

Authentication alone, or a Free/Pro subscription, must never authorize Business APIs. Existing internal pilot screens and routes are not a promise that Business is publicly offered to Free/Pro customers.

The unauthenticated Professional App selection surface follows the offering contract and does not render Business navigation, reservation administration links, or the Business home action while Business is `unavailable` or `preparing`. Existing owner-protected internal pilot routes remain available by direct URL for operational verification; this does not make Business publicly purchasable or visible.

## API access boundary during the preparation period

Existing owner-only Business APIs are internal pilot surfaces. Their shared resolver requires all of the following before the route handler can access Growth Engine records:

1. a valid owner session;
2. an active user;
3. a workspace whose current plan is `business`;
4. workspace identity matching when a route accepts `workspaceId`.

Free and Pro must never pass this resolver. Contract tests maintain an explicit inventory of the current owner Business API routes so a new or edited route cannot silently omit the shared resolver.

The future cross-app Business API is a separate boundary and must not reuse owner-session access as its entitlement model. Before that API is exposed, it must evaluate the canonical subscription entitlement, `businessAvailabilityStatus: available`, and `business.cross_app.flow: true` together. Missing or unreadable entitlement/flag state must deny access. No such public cross-app Business endpoint is introduced during this preparation phase.

The existing Velvet Customer integration remains a narrowly scoped canonical Customer operation owned by Growth Engine. It must not be expanded into a Business entitlement bypass or return Reservation, Customer Payment, Sales, or their internal state.

## Ownership retained by Growth Engine

Growth Engine remains Source of Truth for:

- Customer
- Reservation
- Payment
- Sales
- Public Site
- Business plan workflow

Numeria Studio and Velvet must not add these records to their Free or Pro feature sets. They may hold approved reference IDs or explicitly contracted snapshots only.

## Professional app return boundary

Numeria Studio and Velvet may return only the contracted reference/status fields to Growth Engine:

- `workspaceId`
- `userId`
- `customerId`
- `reservationId`
- `sessionId`
- `reportId`
- `reportRef`
- `status`
- `completedAt`
- `sourceApp`
- `correlationId`

They must not return:

- full appraisal text
- full report text
- full conversation text
- payment details
- sales details
- full Customer master records
- Stripe information
- API keys
- secrets
- secret prompts

Growth Engine exposes this boundary through `/contracts/status` and contract tests keep the allowed and forbidden field lists explicit.

## Two payments that must remain separate

| Payment | Meaning | Handling |
| --- | --- | --- |
| SaaS subscription | The professional pays for Numeria Studio or Velvet Pro, and later Business | Plan/entitlement concern; not stored as Customer Payment or Sales |
| Customer Payment | The professional's customer pays for an appraisal or other service | Growth Engine canonical Payment and Sales |

Do not reuse Customer Payment status, Customer Sales records, or Stripe customer-transaction fields to represent a SaaS plan subscription.

## Cross-app boundary

When Business is implemented after the Free/Pro releases:

- Numeria Studio and Velvet send `workspaceId`, `userId`, `planId`, and the minimum approved reference IDs.
- Growth Engine returns only approved Customer/Reservation/Payment/Sales references or projections.
- Numeria Studio remains canonical for Session, Report, Calculation Result, and Numeria Snapshot.
- Velvet remains canonical for Professional Memory, Visit, professional notes, and its timeline.
- Business availability must not become a hard dependency for Free/Pro professional work.

## Verification scope for this preparation

- contract tests verify the shared PlanId values;
- contract tests verify Free and Pro cannot pass the Business gate;
- contract tests verify Business remains blocked while `unavailable` or `preparing`;
- contract tests verify Business remains blocked until availability and the feature flag are both enabled;
- contract tests verify normal-user Business purchase visibility is false while unavailable;
- contract tests verify the current owner Business API inventory uses the shared authenticated, active-user, Business-plan resolver;
- contract tests verify the Professional return boundary allows only reference/status fields and rejects forbidden/unknown fields;
- `/contracts/status` exposes non-sensitive plan-contract and Business-boundary metadata;
- no Business feature, public purchase route, database migration, payment UI, refund UI, sales UI, or D1 schema change is included.
