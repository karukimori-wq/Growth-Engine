# Growth Engine Production Persistence

Growth Engine owns the canonical Customer, Reservation, Payment, and Sales records. For MVP launch, Customer and Reservation must be backed by production database storage so public bookings remain visible from the Business reservation and customer screens across browsers, devices, and redeploys.

## Current implementation

The application supports three Growth Repository drivers.

| Driver | Use | Persistence |
| --- | --- | --- |
| `mock` | local/demo fallback | process-local only; not valid for external pilot |
| `postgres` | rollback/source migration path | database-backed Customer and Reservation persistence |
| `d1` | Cloudflare Production | D1-backed Customer and Reservation persistence |

The active driver is reported by:

```http
GET /api/persistence/status
```

The owner-protected UI status screen is:

```http
GET /app/business/settings/persistence
```

Production readiness requires:

```json
{
  "repositoryDriver": "d1",
  "d1Configured": true,
  "d1Reachable": true,
  "databaseBackedPersistenceReady": true,
  "blockedUserFlows": []
}
```

## Required Cloudflare Production configuration

Set the following in `wrangler.jsonc` or Cloudflare Worker vars.

```txt
GROWTH_REPOSITORY_DRIVER=d1
```

The Worker must have a D1 binding named `DB` pointing at the `growth-engine` D1 database.

Postgres connection variables are only needed for rollback or one-time canonical import. Do not configure or expose them unless that path is intentionally being used.

Do not expose these values in logs, browser output, public endpoints, or screenshots.

## Schema behavior

The Cloudflare schema creates the MVP D1 tables used by the active runtime:

- `growth_customers`
- `growth_reservations`

This is intentionally scoped to the currently implemented MVP persistence surface. The broader draft schema remains documented in `docs/database-ddl.sql`, but the active runtime repository uses the `growth_*` tables above.

Runtime-created Customer table:

```sql
CREATE TABLE IF NOT EXISTS growth_customers (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  lead_id TEXT,
  customer_number TEXT NOT NULL,
  name TEXT,
  display_name TEXT NOT NULL,
  contact_information JSONB NOT NULL DEFAULT '{}'::jsonb,
  line_user_id TEXT,
  sns_accounts JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_channel TEXT,
  source_campaign_id TEXT,
  source_content_id TEXT,
  referred_by_customer_id TEXT,
  customer_status TEXT NOT NULL,
  first_purchase_at TIMESTAMPTZ,
  last_purchase_at TIMESTAMPTZ,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  purchase_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

Runtime-created Reservation table:

```sql
CREATE TABLE IF NOT EXISTS growth_reservations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  lead_id TEXT,
  customer_id TEXT,
  product_id TEXT NOT NULL,
  professional_studio_type TEXT NOT NULL,
  scheduled_start_at TIMESTAMPTZ NOT NULL,
  scheduled_end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  source_channel TEXT,
  campaign_id TEXT,
  content_id TEXT,
  payment_status TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

Indexes are created for workspace-scoped list and detail paths. All Customer and Reservation reads must remain workspace-scoped.

## Verification sequence after setting env vars

After deploying Production, run the following checks.

1. Check persistence status.

```http
GET https://growth-engine.karukimori.workers.dev/api/persistence/status
```

Expected:

```json
{
  "status": "success",
  "repositoryDriver": "d1",
  "d1Configured": true,
  "d1Reachable": true,
  "databaseBackedPersistenceReady": true,
  "blockedUserFlows": []
}
```

2. Run the combined Customer and Reservation roundtrip from an owner session.

```http
POST https://growth-engine.karukimori.workers.dev/api/persistence/roundtrip
```

Expected:

```json
{
  "status": "success",
  "roundtripReady": true,
  "roundtripStatus": "success",
  "repositoryDriver": "d1",
  "d1Configured": true,
  "d1Reachable": true,
  "checks": {
    "customerCreated": true,
    "customerFound": true,
    "customerListed": true,
    "reservationCreated": true,
    "reservationFound": true,
    "reservationListed": true
  }
}
```

The roundtrip endpoint requires an owner session. If called without a signed owner session, it must return `401` with `errorCode: AUTH_REQUIRED`.

3. Create a public booking.

```http
POST https://growth-engine.karukimori.workers.dev/api/public/bookings
```

Expected: redirect to `/public/booking/confirmed?reservationId=...&productId=...&scheduledStartAt=...`.

The public confirmation URL must not include:

- `workspaceId`
- `ownerUserId`
- `customerId`
- `paymentStatus`
- `salesAmount`
- Stripe identifiers or secrets

4. Confirm the reservation appears in the Business UI.

```http
GET /app/business/reservations
GET /app/business/reservations/{reservationId}
```

Expected: the reservation created through public booking is visible to the signed-in owner workspace and detail page opens.

## Data safety requirements

Growth Engine must keep payment and sales state internal.

Do not send the following to Numeria Studio, Velvet, SNS Planner, Communication Planner, AI Platform Core, public pages, or public redirect URLs unless a future contract explicitly allows it:

- `paymentStatus`
- `salesAmount`
- Stripe information
- full Customer master payload
- Report body
- Velvet professional memory body
- full conversation history
- API keys
- secret prompts

Studio handoffs should remain reference-only, such as:

- `workspaceId`
- `userId`
- `customerId`
- `reservationId`
- `intent`
- `traceId`
- `correlationId`

## Known warning state

If `/api/persistence/status` returns this shape, production DB persistence is not active:

```json
{
  "status": "warning",
  "repositoryDriver": "mock",
  "postgresConfigured": false,
  "databaseBackedPersistenceReady": false,
  "blockedUserFlows": [
    "public_booking.to_business_reservation_list",
    "reservation.detail.after_cross_browser_reload",
    "customer.detail.after_cross_browser_reload"
  ]
}
```

In that state, the code path can create Customer and Reservation objects, but mock storage cannot be treated as production persistence. Public booking may appear accepted, but the Business reservation list is not guaranteed to show that booking after a separate request, browser, serverless instance, or redeploy.
