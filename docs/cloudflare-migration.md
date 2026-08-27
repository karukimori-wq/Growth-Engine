# Growth Engine Cloudflare migration

## Status

Cloudflare migration implementation is in progress. Existing Postgres compatibility remains available while Cloudflare D1 is validated.

## Production target

- Worker: `growth-engine`
- URL: `https://growth-engine.karukimori.workers.dev`
- Persistence driver target: `d1`
- D1 binding: `DB`
- D1 database: `growth-engine`

## Data safety rule

Growth Engine is the canonical owner of Customer, Reservation, Payment and Sales. Migration must not silently drop, overwrite, or transfer canonical ownership of those records.

The first D1 production slice covers Customer and Reservation because those are already the database-backed entities in the current Postgres Growth Repository. Existing Postgres support is retained as a rollback/compatibility path during validation.

## Implemented migration baseline

- OpenNext Cloudflare configuration
- Wrangler Worker configuration
- D1 runtime adapter and health check
- `mock | postgres | d1` Growth Repository driver
- D1 Customer repository
- D1 Reservation repository
- D1 schema for Customer and Reservation
- D1-aware persistence status and roundtrip
- database-driver-agnostic launch readiness
- GitHub Actions Cloudflare Production workflow
- Cloudflare Service Binding declarations for AI Platform Core, Numeria Studio, Velvet and Communication Planner

## Production verification gate

The Cloudflare Production workflow must confirm:

1. TypeScript passes.
2. Cloudflare identity is valid.
3. D1 exists and schema applies remotely.
4. OpenNext Worker builds and deploys.
5. `/health`, `/version`, `/contracts/status`, and `/api/persistence/status` pass.
6. Owner session authentication works without exposing auth secrets.
7. `POST /api/persistence/roundtrip` creates and reads back both Customer and Reservation through D1.
8. The returned Customer and Reservation IDs exist in the remote D1 database.

## Not implied by migration

Cloudflare infrastructure completion does not mean every Growth Engine domain is fully D1-backed. Payment, Revenue, event/audit persistence and other projections must be reviewed separately before any Postgres retirement decision.
