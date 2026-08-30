# Growth Engine External Pilot Minimum Gate

This document tracks the minimum release gate for an external pilot of Growth Engine.

## Required runtime status

External pilot is not considered ready unless all of the following are true in Production:

- `GET /contracts/status` returns contract-safe status.
- Production signed-session auth is configured.
- `VELVET_INTEGRATION_SECRET` is configured without exposing the value.
- Customer and Reservation persistence uses the Cloudflare D1 Growth Repository driver.
- The `DB` binding is reachable from the Worker runtime.
- Public booking writes through the same Growth Repository used by Business reservation screens.

## Readiness endpoint

Use this endpoint as the external pilot gate:

```http
GET https://growth-engine.karukimori.workers.dev/api/launch/growth-engine/external-pilot-readiness
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

The expected blocked pattern before D1 activation is:

```json
{
  "status": "blocked",
  "runtime": {
    "database": {
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
GROWTH_REPOSITORY_DRIVER=d1
Cloudflare Worker DB binding
```

Set the Worker variable and D1 binding, deploy through the Cloudflare Production workflow, then verify:

```http
GET /api/persistence/status
POST /api/persistence/roundtrip
GET /api/launch/growth-engine/external-pilot-readiness
```

## Production deploy note

Cloudflare D1 Production baseline completed: 2026-08-28.

Postgres remains an optional rollback/source-migration path. `GROWTH_ENGINE_SOURCE_POSTGRES_URL` is not required for normal D1 Production operation.

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
