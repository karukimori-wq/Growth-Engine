# MVP Foundation Checklist

This document defines the minimum Growth Engine foundation that is ready for the next implementation phase.

## Foundation Status

The MVP foundation is ready when the repository has:

- Business-plan guarded API entry points
- server-side Workspace/User context boundary
- active user checks for Business APIs
- Growth-owned Customer, Lead, Product, Reservation, Payment, Revenue, Audit Log, Event Outbox, and Processed External Event domain models
- first mock-backed APIs for Business Home, Leads, Customers, Products, Reservations, Lead conversion, Stripe Checkout, Stripe Webhook, and SNS Planner briefs
- approved shared contract terminology: `Report`, `sessionId`, versioned event names, and no legacy `Document` or unversioned event names
- Stripe-only customer-facing payment direction for MVP
- Workspace-scoped Stripe webhook processing
- repository, audit log, event publisher, workspace context, and Stripe client boundaries
- PostgreSQL-oriented DDL draft for the durable tables
- mock drivers as the default local runtime

## Local Runtime Defaults

Use `.env.example` as the local baseline.

```text
GROWTH_REPOSITORY_DRIVER=mock
AUDIT_LOG_REPOSITORY_DRIVER=mock
EVENT_PUBLISHER_DRIVER=mock
```

Production drivers intentionally fail closed until implemented. Do not enable `postgres` or `event-engine` drivers in deployed environments until those implementations are added and tested.

## Verification

The MVP foundation must pass:

```bash
npm run typecheck
npm run build
```

## Not Included Yet

The MVP foundation does not yet include:

- production authentication
- live database repository implementation
- live Stripe SDK Checkout creation
- real Event Engine dispatch transport
- LINE connection
- live Numeria Studio, SNS Planner, or AI Platform Core API calls
- public customer-facing booking/payment site

These are next-phase implementation tasks, not blockers for the foundation PR.
