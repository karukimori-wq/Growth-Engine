# Twenty Reference Adoption for Growth Engine

Growth Engine may use Twenty as a product and architecture reference for CRM-style business workflows. This document defines what can be adopted, what must not be copied, and how the ideas map to Growth Engine's responsibility boundaries.

Reference repository: https://github.com/twentyhq/twenty

## License boundary

Twenty is primarily licensed under AGPL-3.0, with some packages under MIT or commercial terms. Growth Engine must not copy Twenty source code into this repository unless the specific file/package license has been reviewed and explicitly approved.

Allowed use:

- product behavior analysis
- UI and information architecture reference
- data modeling inspiration
- workflow and object model concepts
- non-verbatim implementation of similar concepts

Not allowed without explicit license review:

- copying Twenty source files
- porting implementation details line-by-line
- importing AGPL packages into Growth Engine runtime
- reusing Twenty trademarks or branded assets

## What Growth Engine should adopt conceptually

### 1. CRM primitives

Twenty models CRM around flexible records, views, activities, and workflows. Growth Engine should adopt the primitive-level thinking, but keep the domain narrower.

Growth Engine equivalent:

- `Customer`
- `Lead` / `Prospect`
- `Reservation` / `Visit Schedule`
- `Payment`
- `Sales` / `Revenue`
- `Followup`
- `Referral`
- `Campaign`
- `ContentBrief`

Do not turn Growth Engine into a generic Salesforce replacement. Growth Engine remains a Professional App business foundation.

### 2. Workspace-scoped data

Twenty is workspace-oriented. Growth Engine should continue to enforce workspace-scoped records.

MVP identity remains:

- `workspaceId`
- `userId`
- `ownerUserId`

`professionalId` remains future-only and must not become required for MVP.

### 3. Saved views and list UX

Twenty's list/view ideas are useful for Growth Engine MVP screens.

Adopt for Growth Engine:

- table-style lists
- filter chips
- saved filters later
- status-focused views
- empty states
- quick actions per row

Priority screens:

- `/app/business/customers`
- `/app/business/prospects`
- `/app/business/reservations`
- `/app/business/sales`
- `/app/business/repeat`
- `/app/business/referrals`
- `/app/business/analytics`

### 4. Activity timeline pattern

Twenty's CRM timeline concept maps well to Growth Engine customer context.

Growth Engine should create a customer activity timeline composed of Growth-owned events and external reference events.

Allowed timeline records:

- reservation created
- reservation completed
- payment completed
- followup scheduled
- followup completed
- referral created
- SNS PostDraft requested
- SNS MessageDraft requested
- Numeria session reference created
- Numeria report reference received
- Velvet visit reference received
- Communication Planner conversation reference received

Do not copy full external content into Growth Engine.

Growth Engine may store references only:

- `sessionId`
- `reportId`
- `visitId`
- `noteId`
- `conversationId`
- `replyDraftId`
- `postDraftId`
- `messageDraftId`

Forbidden timeline payloads:

- Report body
- Velvet professional memory body
- full conversation history
- payment card data
- Stripe secrets
- API keys
- secret prompts

### 5. Metadata-driven display labels

Twenty's object/view flexibility supports Growth Engine's multi-Professional-App direction.

Growth Engine should continue using internal common keys and studio-specific labels.

Example:

- internal key: `reservations`
- Numeria label: `鑑定予約`
- Velvet label: `来店予定`

The internal Growth Engine model remains common even when labels differ by `studioKey`.

### 6. Workflow and automation concepts

Twenty's workflow concept is useful, but Growth Engine automation must respect user confirmation for MVP.

Adopt:

- next action lists
- follow-up task generation
- status transitions
- event-driven recommendations

Do not adopt:

- fully automatic customer messaging in MVP
- automatic external posting without confirmation
- autonomous payment or refund actions

## Implementation priority inspired by Twenty

1. Database-backed Customer and Reservation persistence.
2. Customer detail timeline using Growth-owned records and external reference IDs.
3. List filters for reservations, customers, prospects, and sales.
4. Saved view metadata after core DB persistence is complete.
5. Activity and task surfaces for follow-up, repeat, and referral workflows.

## Responsibility boundaries remain unchanged

Growth Engine owns:

- Customer
- Lead / Prospect
- Reservation / Visit Schedule
- Payment
- Sales / Revenue
- Follow-up
- Referral
- Analytics
- Business workflow decisions

Professional Apps own:

- Numeria Studio: Session and Report
- Velvet: visit records, professional memory, notes

SNS Planner owns:

- PostDraft
- MessageDraft for simple outbound draft creation

Communication Planner owns:

- Unified Inbox
- Conversation
- Message
- ConversationContext
- ReplyDraft
- SafetyCheck
- communication next actions

AI Platform Core owns:

- AI Activity
- AI Usage
- AI Capability

Platform Admin owns:

- operational snapshots only

## Definition of Done

- Twenty is listed as a reference source, not a code dependency.
- Growth Engine does not copy AGPL implementation code.
- Growth Engine uses Twenty-inspired CRM concepts only where they improve Customer, Reservation, Sales, Follow-up, Referral, or Analytics workflows.
- Studio-specific professional records remain outside Growth Engine.
- External app payloads remain reference-only.
