# Numeria Studio / Velvet integration readiness

## Numeria Studio

Current state:
- Growth Engine owns Customer, Reservation, customer Payment, and Sales.
- Numeria Studio owns Session, Report, calculation/appraisal results, and Numeria snapshots.
- User-facing handoff target is `/app/growth/start`.
- Server Session.Start integration check targets `/api/sessions/start`.
- `NUMERIA_STUDIO_BASE_URL` controls the server integration endpoint and preserves the previous endpoint as a fallback until the independent-domain cutover is verified.

Allowed handoff context:
- `workspaceId`
- `userId`
- `reservationId`
- `customerId`
- intent

Forbidden payload expansion:
- payment status or Stripe data
- sales amount or revenue data
- report body
- full consultation transcript
- API keys, secrets, or prompt data

## Velvet

Current state:
- Growth Engine remains the canonical Customer owner.
- Velvet may call the narrow Growth Engine Customer integration using its integration authentication boundary.
- Velvet owns professional memory, Visit, professional notes, and timeline data.
- Visit integration uses `VELVET_BASE_URL` and reference-only payloads.

The Velvet Customer projection must remain minimal and must not expose Reservation, Payment, Sales, full customer master data, or professional notes.

## Business boundary

Neither integration is a Business entitlement bypass. Free and Pro plans do not gain access to future Business APIs through Numeria Studio or Velvet integrations. Business remains not offered until the shared plan contract, offering availability, and feature flag all authorize it.

## Release rule

Routine development is validated by the non-production CI workflow. Cloudflare Production is run only at a release/deployment boundary after CI is green and any required runtime variables are configured.
