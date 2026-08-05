# Growth Engine Integration

Growth Engine integrates with Numeria Studio, SNS Planner, and AI Platform Core
through the shared contracts repository:

- https://github.com/karukimori-wq/professional-platform-contracts

## Integration Principles

Use APIs for immediate operations. Use events for completed state-change
notifications.

Growth Engine remains the business workflow owner. It must not absorb
Professional Studio domain logic, SNS Planner content generation details, or AI
Platform Core runtime internals.

## Numeria Studio / Professional Studio

Growth Engine is the Customer source of truth. Numeria Studio references
`customerId`.

Growth Engine may call:

- `Customer.Create`
- `Customer.Get`
- `Customer.Find`
- `Reservation.Create`
- `Reservation.Get`
- `Session.Start`
- `Session.Complete`
- `Report.Generate`
- `Report.Preview`
- `Report.ExportPdf`
- `ServiceReference.List`

Numeria Studio may publish:

- `studio.session.started.v1`
- `studio.session.completed.v1`
- `studio.report.generated.v1`
- `studio.service_reference.updated.v1`

Use `Report` for all external contracts. Do not use `Document` in Growth Engine
integration naming.

Growth Engine must not copy unrestricted consultation text, practitioner notes,
or domain-specific appraisal data for marketing use. Use IDs, tags, categories,
allowlisted fields, or snapshots where the contracts allow it.

## SNS Planner

Growth Engine calls SNS Planner only for post draft creation.

Growth Engine decides and sends:

- `purpose`
- `targetAudience`
- `cta`
- `channel`
- `tone`
- `constraints`
- campaign reference
- due date

SNS Planner returns:

- draft id
- draft state
- post content variants
- hashtags
- image prompt ideas
- reel ideas
- story ideas

Approved API operations:

- `PostDraft.Generate`
- `PostDraft.Rewrite`
- `PostTemplate.List`

Approved SNS Planner events:

- `sns.post_draft.created.v1`
- `sns.post_draft.updated.v1`

SNS Planner must not decide campaign objectives, target audience, CTA strategy,
lead nurturing, Business Plan rules, or sales judgement.

## AI Platform Core

Growth Engine delegates AI execution and usage tracking to AI Platform Core.

Approved API operations:

- `Activity.Create`
- `Activity.Get`
- `Usage.List`
- `PromptTemplate.Render`
- `Capability.Register`

Approved AI events:

- `ai.activity.created.v1`
- `ai.activity.completed.v1`
- `ai.activity.failed.v1`
- `ai.usage.recorded.v1`

AI Platform Core does not decide business workflows. Growth Engine owns the
decision and user confirmation flow for acquisition, sales, follow-up, and SNS
strategy.

## Forbidden Legacy Names

Do not introduce these names in cross-system code, payloads, or docs:

- `Session.Started`
- `Session.Completed`
- `Document.Generated`
- `Document.Generate`
- `Document.Preview`
- `Document.ExportPdf`

Use instead:

- `studio.session.started.v1`
- `studio.session.completed.v1`
- `studio.report.generated.v1`
- `Report.Generate`
- `Report.Preview`
- `Report.ExportPdf`

## Pending Events

`studio.recommendation.created.v1` is Pending in the contracts repository. Growth
Engine may discuss recommendations internally, but it must not subscribe to or
publish this event as a stable external contract.

## Implementation Checklist

Before merging integration changes:

- Confirm each operation exists in `docs/contracts/api-catalog.md`.
- Confirm each event exists in `docs/contracts/event-catalog.md`.
- Confirm Customer canonical data remains in Growth Engine.
- Confirm Professional Studio uses `Report`, not `Document`, externally.
- Confirm SNS Planner receives business intent and does not create it.
- Confirm AI Platform Core executes capabilities but does not own decisions.
- Confirm Pending events are not treated as stable.
