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
- integration client interfaces for Numeria Studio, AI Platform Core, and SNS Planner

## Current Scope

This is not yet connected to persistent storage, authentication, Numeria Studio, AI Platform Core, SNS Planner, LINE, or Stripe.

The goal of this phase is to define the first code structure and make the core responsibilities visible in code:

- Growth Engine owns Business growth features.
- Business features are guarded by plan checks.
- Customer and reservation context are modeled explicitly.
- AI suggestions include evidence and are not auto-executed.
- SNS Planner integration is represented as a brief request instead of post editing.
- External contracts use `Report`, `sessionId`, and versioned event names.
- Growth Engine publishes `growth.*.v1` events and subscribes to formal `studio.*.v1` and `sns.*.v1` events.

## Next Step

Phase 1 should continue with:

1. replace the demo Workspace resolver with real authentication
2. persistent database schema
3. durable audit log storage
4. Event Engine transport and retry handling
5. idempotent webhook/event consumers
