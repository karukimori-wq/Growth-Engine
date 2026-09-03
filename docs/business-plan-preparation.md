# Business Plan Preparation

Status: contract preparation only. Business product functionality is not being added in this change.

Adopted professional-platform-contracts Plan contract from `main` (`4a1f479`).

## Shared PlanId

Growth Engine recognizes the `professional-platform-contracts` PlanId values:

- `free`
- `pro`
- `business`

The existence of the `business` identifier does not mean Business is currently offered.

## Current availability

- Business offering status: `not_offered`
- Business feature key / flag: `business.cross_app.flow`
- feature flag default: disabled
- public Business entry while not offered: hidden
- access policy: fail-closed

Future Business access requires all three conditions:

1. the authenticated workspace has `planId: business`;
2. the Business offering status is `available`;
3. the Business integration feature flag is enabled.

Authentication alone, or a Free/Pro subscription, must never authorize Business APIs. Existing internal pilot screens and routes are not a promise that Business is publicly offered to Free/Pro customers.

The unauthenticated Professional App selection surface follows the offering status and does not render Business navigation, reservation administration links, or the Business home action while the offering is `not_offered`. Existing owner-protected internal pilot routes remain available by direct URL for operational verification; this does not make Business publicly purchasable or visible.

## Ownership retained by Growth Engine

- Customer
- Reservation
- Payment received from the professional's customer
- Sales

Numeria Studio and Velvet must not add these records to their Pro feature sets. They may hold approved reference IDs or explicitly contracted snapshots only.

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
- contract tests verify Business remains blocked until offering availability and the feature flag are both enabled;
- `/contracts/status` exposes non-sensitive plan-contract metadata;
- no Business feature, public purchase route, database migration, or D1 schema change is included.
