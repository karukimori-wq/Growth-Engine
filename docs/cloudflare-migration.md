# Growth Engine Cloudflare migration

## Status

Cloudflare migration is complete for the Growth Engine MVP persistence slice. Existing Postgres compatibility remains available as a rollback and source-migration path, but Production now runs on Cloudflare Workers with D1-backed Customer and Reservation persistence.

## Production target

- Worker: `growth-engine`
- URL: `https://growth-engine.karukimori.workers.dev`
- Persistence driver target: `d1`
- D1 binding: `DB`
- D1 database: `growth-engine`

## Data safety rule

Growth Engine is the canonical owner of Customer, Reservation, Payment and Sales. Migration must not silently drop, overwrite, or transfer canonical ownership of those records.

If an existing Production Postgres datastore must be migrated, the deployment workflow can read the source database and migrate those records into D1 before deployment. The source connection is supplied only as the optional GitHub Actions secret `GROWTH_ENGINE_SOURCE_POSTGRES_URL`; its value must never be logged or copied into Worker vars.

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
- Postgres-to-D1 canonical Customer/Reservation export/import script
- source-vs-D1 migration count gate before Worker deployment
- GitHub Actions Cloudflare Production workflow
- Cloudflare Service Binding declarations for AI Platform Core, Numeria Studio, Velvet and Communication Planner

## Production verification gate

The Cloudflare Production workflow must confirm:

1. TypeScript passes.
2. Cloudflare identity is valid.
3. D1 exists and schema applies remotely.
4. Optional existing Postgres Customer/Reservation records are exported without logging record contents when `GROWTH_ENGINE_SOURCE_POSTGRES_URL` is configured.
5. Optional canonical records are imported idempotently into D1 and D1 counts are not lower than source counts.
6. OpenNext Worker builds and deploys.
7. `/health`, `/version`, `/contracts/status`, and `/api/persistence/status` pass.
8. Owner session authentication works without exposing auth secrets.
9. `POST /api/persistence/roundtrip` creates and reads back both Customer and Reservation through D1.
10. The returned Customer and Reservation IDs exist in the remote D1 database.

## Required GitHub Actions secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `GROWTH_ENGINE_AUTH_SECRET`
- `GROWTH_ENGINE_OWNER_ACCESS_CODE`
- `GROWTH_ENGINE_SOURCE_POSTGRES_URL` (optional; only needed for Postgres-to-D1 canonical import)
- `VELVET_INTEGRATION_SECRET` (recommended to preserve the existing trusted Velvet bridge)

## Not implied by migration

Cloudflare infrastructure completion does not mean every Growth Engine domain is fully D1-backed. Payment, Revenue, event/audit persistence and other projections must be reviewed separately before any Postgres retirement decision.
