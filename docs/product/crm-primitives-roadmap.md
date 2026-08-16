# CRM Primitives Roadmap

This roadmap converts the Twenty reference analysis into Growth Engine implementation tasks.

Twenty is used only as a conceptual reference. Growth Engine must not copy AGPL implementation code.

## Objective

Improve Growth Engine's Business surfaces by introducing CRM primitives that directly support acquisition, booking, payment, follow-up, repeat, referral, and analytics.

Growth Engine remains a Professional App Business foundation, not a generic CRM product.

## Primitive 1: Customer record

Canonical owner: Growth Engine

Required MVP behavior:

- database-backed Customer persistence
- list customers by workspace
- customer detail page
- edit display name and contact fields
- show source channel
- show reservation history references
- show payment and sales summary inside Growth Engine only

Do not send full Customer master payload to Numeria Studio, Velvet, SNS Planner, Communication Planner, or AI Platform Core.

## Primitive 2: Reservation / Visit Schedule record

Canonical owner: Growth Engine

Required MVP behavior:

- database-backed Reservation persistence
- public booking creates canonical Reservation
- Business reservation list reads the same source
- reservation detail opens by `reservationId`
- handoff to Numeria or Velvet uses reference IDs only

Studio-specific handoff examples:

- Numeria: `workspaceId`, `userId`, `customerId`, `reservationId`, `intent=start_appraisal_session`
- Velvet: `workspaceId`, `userId`, `customerId`, `reservationId` or `visitScheduleId`, `intent=start_visit_record`

Do not send `paymentStatus`, `salesAmount`, Stripe information, full notes, or Report bodies to Professional Apps.

## Primitive 3: View model

Canonical owner: Growth Engine

Use Twenty-inspired list and saved-view concepts, but implement only the MVP subset first.

MVP list views:

- Customers
- Prospects
- Reservations
- Sales
- Repeat candidates
- Referrals

MVP filters:

- status
- source channel
- date range
- payment state displayed only inside Growth Engine
- Professional App / `studioKey`

Future saved views:

- Today's reservations
- Unpaid reservations
- Repeat candidates
- Referral candidates
- High-value customers
- Inactive customers

## Primitive 4: Customer activity timeline

Canonical owner: Growth Engine for Business events; external apps own their domain records.

Growth Engine timeline should combine Growth-owned events and external references.

Allowed timeline entries:

- customer created
- lead converted
- reservation created
- payment completed
- followup scheduled
- followup completed
- referral created
- SNS PostDraft requested
- SNS MessageDraft requested
- Numeria session reference
- Numeria report reference
- Velvet visit reference
- Communication Planner conversation reference

Forbidden copied content:

- full Report body
- full Velvet professional memory
- full conversation history
- full customer master payload outside Growth Engine
- payment card data
- Stripe secrets
- API keys
- secret prompts

## Primitive 5: Task / next action surface

Canonical owner depends on action type.

Growth Engine owns Business next actions:

- follow up after reservation
- unpaid payment check
- repeat guidance
- referral request candidate
- campaign / SNS Planner request candidate

Communication Planner owns conversation next actions:

- reply needed
- promise follow-up inside a conversation
- reply draft safety check

Growth Engine may reference Communication Planner `nextActionId`, but must not become the source of truth for conversation records.

## Implementation order

1. Enable Production Postgres persistence for Customer and Reservation.
2. Verify public booking to Business reservation list across browser/device boundaries.
3. Build Customer detail activity timeline with Growth-owned records first.
4. Add Reservation and Sales filters.
5. Add Repeat and Referral candidate views.
6. Add external reference timeline entries for Numeria, Velvet, SNS Planner, and Communication Planner.
7. Add saved-view metadata after the core DB persistence is stable.

## Acceptance criteria

- No Growth Engine MVP menu returns 404.
- Customer and Reservation are database-backed in Production.
- Public booking and Business reservation list use the same repository.
- Customer detail shows a clear timeline without copying external app bodies.
- Payment and sales fields remain Growth Engine internal.
- Studio apps receive reference IDs only.
- Twenty remains a reference, not a runtime dependency.
