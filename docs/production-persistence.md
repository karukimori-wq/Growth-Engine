# Growth Engine Production Persistence

Growth Engine owns the canonical Customer, Reservation, Payment, and Sales records. For MVP launch, Customer and Reservation must be backed by production database storage so public bookings remain visible from the Business reservation and customer screens across browsers, devices, and redeploys.

## Current implementation

The application supports two Growth Repository drivers.

| Driver | Use | Persistence |
| --- | --- | --- |
| `mock` | local/demo fallback | process-local only; not valid for external pilot |
| `postgres` | production MVP | database-backed Customer and Reservation persistence |

The active driver is reported by:

```http
GET /api/persistence/status
```

Production readiness requires:

```json
{
  "repositoryDriver": "postgres",
  "postgresConfigured": true,
  "databaseBackedPersistenceReady": true,
  "blockedUserFlows": []
}
```

## Required Vercel Production environment variables

Set the following in the Growth Engine Vercel project Production environment.

```txt
GROWTH_REPOSITORY_DRIVER=postgres
```

Set at least one supported Postgres connection variable. The runtime checks these names:

```txt
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
DATABASE_URL
```

Do not expose these values in logs, browser output, public endpoints, or screenshots.

## Schema behavior

The production repository creates its MVP tables lazily when the repository is first used:

- `growth_customers`
- `growth_reservations`

This is intentionally scoped to the currently implemented MVP persistence surface. The broader draft schema remains documented in `docs/database-ddl.sql`, but the active runtime repository uses the `growth_*` tables above.

## Verification sequence after setting env vars

After configuring Production env vars, redeploy Production and run the following checks.

1. Check persistence status.

```http
GET https://growth-engine-ruby-nine.vercel.app/api/persistence/status
```

Expected:

```json
{
  "status": "success",
  "repositoryDriver": "postgres",
  "postgresConfigured": true,
  "databaseBackedPersistenceReady": true,
  "blockedUserFlows": []
}
```

2. Run Customer roundtrip.

```http
POST https://growth-engine-ruby-nine.vercel.app/api/persistence/customer-roundtrip-test
```

Expected: `status: success`, created customer can be found by detail and list APIs.

3. Run Reservation roundtrip.

```http
POST https://growth-engine-ruby-nine.vercel.app/api/persistence/reservation-roundtrip-test
```

Expected: `status: success`, created reservation can be found by detail and list APIs, and customer reference is readable.

4. Create a public booking.

```http
POST https://growth-engine-ruby-nine.vercel.app/api/public/bookings
```

Expected: redirect to `/public/booking/confirmed?reservationId=...&productId=...&scheduledStartAt=...`.

The public confirmation URL must not include:

- `workspaceId`
- `ownerUserId`
- `customerId`
- `paymentStatus`
- `salesAmount`
- Stripe identifiers or secrets

5. Confirm the reservation appears in the Business UI.

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
