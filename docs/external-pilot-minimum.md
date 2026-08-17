# Growth Engine External Pilot Minimum Gate

This document tracks the minimum release gate for an external pilot of Growth Engine.

## Required runtime status

External pilot is not considered ready unless all of the following are true in Production:

- `GET /contracts/status` returns contract-safe status.
- Production signed-session auth is configured.
- `VELVET_INTEGRATION_SECRET` is configured without exposing the value.
- Customer and Reservation persistence uses the Postgres Growth Repository driver.
- Postgres is reachable from runtime.
- Public booking writes through the same Growth Repository used by Business reservation screens.

## Readiness endpoint

Use this endpoint as the external pilot gate:

```http
GET https://growth-engine-ruby-nine.vercel.app/api/launch/growth-engine/external-pilot-readiness
```

Expected when ready:

```json
{
  "status": "ready",
  "minimumExternalPilotReady": true
}
```

If the endpoint returns `blocked`, do not start an external pilot.

## Current hard blocker pattern

The expected blocked pattern before DB activation is:

```json
{
  "status": "blocked",
  "runtime": {
    "postgres": {
      "repositoryDriver": "mock",
      "configured": false,
      "reachable": false,
      "databaseBackedPersistenceReady": false
    }
  }
}
```

Required action:

```txt
GROWTH_REPOSITORY_DRIVER=postgres
POSTGRES_URL or POSTGRES_PRISMA_URL or POSTGRES_URL_NON_POOLING or DATABASE_URL
```

Set these as Vercel Production environment variables, redeploy Production, then verify:

```http
GET /api/persistence/status
POST /api/persistence/roundtrip
GET /api/launch/growth-engine/external-pilot-readiness
```

## Data boundary

Do not send the following outside Growth Engine during pilot:

- paymentStatus
- salesAmount
- Stripe information
- full Customer master payload
- Report body
- Professional memory body
- full conversation history
- API keys
- secret prompts
