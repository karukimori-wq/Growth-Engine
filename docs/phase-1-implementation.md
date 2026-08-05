# Phase 1 Implementation Notes

This repository now includes the first implementation foundation for Growth Engine.

## Included

- Next.js App Router project skeleton
- TypeScript configuration
- Business plan access guard
- Core domain types based on requirements v1.0
- Business Home UI prototype
- Business Home API prototype
- SNS Planner content brief API prototype
- Workspace context resolver
- request-aware Workspace/User context adapter for production auth integration
- `WorkspaceContextProvider` interface boundary for replacing demo identity with production authentication
- server-side Business authorization helper
- active user authorization check for Business APIs
- audit log interface
- audit log repository boundary backed by the current mock store
- Event Engine publisher interface
- Event Outbox domain model and mock queue for pending/published/failed events
- `AuditLogRepository` and `EventPublisher` interface boundaries for durable storage and transport replacement
- integration client interfaces for Numeria Studio, AI Platform Core, SNS Planner, and Stripe
- mock repository layer for Lead, Customer, Product, Reservation, Payment, and Revenue
- `GrowthRepository` interface boundary for replacing the mock repository with persistent storage
- first Business APIs for leads, customers, products, reservations, lead conversion, Stripe checkout, and Stripe webhooks
- database schema draft for persistent storage
- PostgreSQL-oriented DDL draft for the persistent tables and required indexes
- MVP identity rule: use `workspaceId + userId`, keep `professionalId` as future extension
- MVP payment rule: Growth Engine owns Stripe-only customer-facing payments
- Stripe Checkout and webhook API prototypes
- Stripe webhook raw-body parsing and signature verification when `STRIPE_WEBHOOK_SECRET` is configured
- mock idempotency check for Stripe webhook event IDs
- payment webhook handling that updates Payment, Reservation payment status, and Revenue
- `ProcessedExternalEvent` domain model for provider-level webhook/event idempotency
- audit logging for Customer creation, Lead conversion, Reservation creation, Stripe Checkout creation, payment completion, and refund processing

## Current Scope

This is not yet connected to persistent storage, production authentication, Numeria Studio, AI Platform Core, SNS Planner, LINE, or live Stripe SDK calls.

The goal of this phase is to define the first code structure and make the core responsibilities visible in code:

- Growth Engine owns Business growth features.
- Business features are guarded by plan checks.
- Customer and reservation context are modeled explicitly.
- AI suggestions include evidence and are not auto-executed.
- SNS Planner integration is represented as a brief request instead of post editing.
- External contracts use `Report`, `sessionId`, and versioned event names.
- Growth Engine publishes only event-catalog approved `growth.*.v1` events and subscribes to formal `studio.*.v1`, `sns.*.v1`, and `ai.*.v1` events.
- Customer creation and lead conversion are represented in Growth Engine first, keeping Customer ownership in this repository.
- Customer, Reservation, Payment, Public Site, and Sales are owned by `workspaceId`; `userId` records the acting practitioner or staff user.
- `professionalId` is not required in MVP payloads for Growth Engine, Numeria Studio, SNS Planner, or AI Platform Core.
- Payment status is owned by Growth Engine. Numeria Studio should only reference payment state and appraisal start eligibility.
- External webhook/event idempotency is represented with `workspaceId + provider + externalEventId`.
- Stripe payment APIs and events remain internal until added to the shared API and event catalogs.
- API handlers resolve `workspaceId`, `userId`, `ownerUserId`, role, and plan through a single context boundary. The current adapter keeps demo data server-side and must not trust client-controlled headers for identity, role, plan, or workspace.
- Business API handlers require an active user before plan and workspace checks.
- Audit log entries are stored through a repository-style boundary and avoid unnecessary personal or consultation text in metadata.
- Published Growth events are first recorded in an Outbox boundary so a real Event Engine dispatcher can add durable delivery, retries, and observability later.
- Business API handlers keep using stable repository functions while the implementation now sits behind a `GrowthRepository` boundary.
- Audit logging and event publishing keep stable function exports while their implementations now sit behind replaceable interfaces.

## Next Step

Phase 1 should continue with:

1. replace the demo Workspace context adapter with the production authentication provider
2. replace mock repositories with persistent database storage
3. replace mock audit log storage with durable database storage
4. replace the mock Event Outbox with durable Event Engine dispatcher storage, transport, retry handling, and observability
5. database-backed idempotent webhook/event consumers
6. replace Stripe checkout prototypes with live Stripe SDK calls
7. apply the DDL in a real database migration and enforce it in production environments
