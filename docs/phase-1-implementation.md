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
- server-side Business authorization helper
- audit log interface
- Event Engine publisher interface
- integration client interfaces for Numeria Studio, AI Platform Core, SNS Planner, and Stripe
- mock repository layer for Lead, Customer, Product, Reservation, Payment, and Revenue
- first Business APIs for leads, customers, products, reservations, lead conversion, Stripe checkout, and Stripe webhooks
- database schema draft for persistent storage
- MVP identity rule: use `workspaceId + userId`, keep `professionalId` as future extension
- MVP payment rule: Growth Engine owns Stripe-only customer-facing payments
- Stripe Checkout and webhook API prototypes
- mock idempotency check for Stripe webhook event IDs
- payment webhook handling that updates Payment, Reservation payment status, Revenue, and payment events

## Current Scope

This is not yet connected to persistent storage, authentication, Numeria Studio, AI Platform Core, SNS Planner, LINE, or live Stripe.

The goal of this phase is to define the first code structure and make the core responsibilities visible in code:

- Growth Engine owns Business growth features.
- Business features are guarded by plan checks.
- Customer and reservation context are modeled explicitly.
- AI suggestions include evidence and are not auto-executed.
- SNS Planner integration is represented as a brief request instead of post editing.
- External contracts use `Report`, `sessionId`, and versioned event names.
- Growth Engine publishes `growth.*.v1` events and subscribes to formal `studio.*.v1` and `sns.*.v1` events.
- Customer creation and lead conversion are represented in Growth Engine first, keeping Customer ownership in this repository.
- Customer, Reservation, Payment, Public Site, and Sales are owned by `workspaceId`; `userId` records the acting practitioner or staff user.
- `professionalId` is not required in MVP payloads for Growth Engine, Numeria Studio, SNS Planner, or AI Platform Core.
- Payment status is owned by Growth Engine. Numeria Studio should only reference payment state and appraisal start eligibility.

## Next Step

Phase 1 should continue with:

1. replace the demo Workspace resolver with real authentication
2. replace mock repositories with persistent database storage
3. durable audit log storage
4. Event Engine transport and retry handling
5. database-backed idempotent webhook/event consumers
6. replace Stripe prototypes with signed webhook verification and live Stripe SDK calls
7. persist processed external webhook event IDs with a unique provider/event ID constraint
