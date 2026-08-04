# Integration Guide

This document explains how Growth Engine should integrate with the other Professional Platform repositories using the shared contracts repository.

Shared contracts source:

- https://github.com/karukimori-wq/professional-platform-contracts

Related Growth Engine reference:

- [Contracts Reference](./contracts.md)

## Integration Principles

Growth Engine coordinates business growth workflows, but it does not absorb the responsibilities of the other systems.

| System | Growth Engine Relationship |
| --- | --- |
| Professional Studio | Growth Engine provides customer, reservation, sales, and follow-up context |
| Numeria Studio | Initial Professional Studio implementation connected to Growth Engine |
| SNS Planner | Growth Engine sends post creation briefs and receives draft status/results |
| AI Platform Core | Growth Engine delegates AI execution and usage tracking |
| Event Engine | Growth Engine publishes and subscribes to state-change events |

## Synchronous API Integration

Use APIs when Growth Engine or another system needs an immediate result.

Approved operation names come from the contracts repository API catalog:

- `Customer.Create`
- `Customer.Get`
- `Customer.Find`
- `Customer.UpdateStatus`
- `Reservation.Create`
- `Reservation.Get`
- `Session.Start`
- `Session.Complete`
- `Report.Generate`
- `Report.Preview`
- `Report.ExportPdf`
- `ServiceReference.List`
- `PostDraft.Generate`
- `PostDraft.Rewrite`
- `PostTemplate.List`
- `Capability.Register`
- `Activity.Create`
- `Activity.Get`
- `Usage.List`
- `PromptTemplate.Render`

Product repositories may map these operation names to HTTP routes, RPC calls, server actions, or SDK methods. The operation name should remain stable even if transport changes.

## Event Integration

Use events when a completed state change should notify downstream systems.

Events must be:

- versioned
- past tense
- treated as notifications, not synchronous commands
- idempotent for consumers

Growth Engine publishes these approved events:

| Event | Purpose |
| --- | --- |
| `growth.customer.created.v1` | A canonical customer was created |
| `growth.customer.updated.v1` | Canonical customer display or contact metadata changed |
| `growth.lead.converted.v1` | A lead became a client or booked customer |
| `growth.reservation.created.v1` | A reservation was created |
| `growth.reservation.cancelled.v1` | A reservation was cancelled |

Growth Engine consumes these approved events:

| Event | Publisher | Purpose |
| --- | --- | --- |
| `studio.session.started.v1` | Professional Studio | A professional work session started |
| `studio.session.completed.v1` | Professional Studio | A professional work session completed |
| `studio.report.generated.v1` | Professional Studio | A report was generated |
| `studio.service_reference.updated.v1` | Professional Studio | Sellable service reference changed |
| `ai.activity.created.v1` | AI Platform Core | AI activity was accepted |
| `ai.activity.completed.v1` | AI Platform Core | AI activity completed |
| `ai.activity.failed.v1` | AI Platform Core | AI activity failed |
| `ai.usage.recorded.v1` | AI Platform Core | AI usage was recorded |
| `sns.post_draft.created.v1` | SNS Planner | A post draft was created |
| `sns.post_draft.updated.v1` | SNS Planner | A post draft was updated |

Pending events in the contracts repository must not be treated as stable until approved.

## Growth Engine to Numeria Studio

Growth Engine passes business context into Numeria Studio when a user starts or continues professional work.

Minimum context:

- `workspaceId`
- `customerId`
- `reservationId`
- `productId`
- reservation date/time
- consultation theme
- pre-questionnaire reference
- source channel
- campaign reference
- payment status

Numeria Studio should return Professional Studio context through approved APIs and events:

- `sessionId`
- session status
- session started/completed timestamps
- service type
- concern tags
- `reportId`
- report generation status
- next recommended date when allowed
- follow-up allowed flag
- review request allowed flag

Growth Engine must not copy unrestricted reading text or sensitive professional fields for marketing use.

## Growth Engine to SNS Planner

Growth Engine decides business strategy. SNS Planner creates post drafts.

Growth Engine sends:

- objective
- target audience
- topic
- content type
- channel
- CTA
- source insights
- due date

SNS Planner returns:

- draft id
- status
- channel
- published timestamp when available
- tracking link id when available

Growth Engine must not reimplement SNS Planner's post editor, asset manager, or SNS-specific drafting logic.

## Growth Engine to AI Platform Core

Growth Engine delegates AI execution to AI Platform Core.

Growth Engine may request AI support for:

- consultation tag trend analysis
- content topic suggestions
- follow-up target suggestions
- funnel bottleneck analysis
- revenue and product analysis
- next-action suggestions

Growth Engine owns the business decision and UI confirmation flow. AI Platform Core owns runtime, prompts, tools, workflow execution, activity records, usage, and cost tracking.

## Data Protection Rules

When integrating with Professional Studio and AI Platform Core:

- use `workspaceId` on all tenant-scoped records
- verify server-side authorization
- use allowlisted payload fields
- prefer tags, categories, aggregated values, and anonymized data
- do not log sensitive consultation text, payment data, or secrets
- require user confirmation before AI-suggested external messages or publication actions

## Implementation Checklist

Before merging integration code:

1. Confirm the operation or event exists in the contracts repository.
2. Confirm Growth Engine owns the business responsibility.
3. Confirm the payload uses shared names from the glossary.
4. Confirm sensitive data is minimized.
5. Confirm events are idempotent for retry.
6. Confirm server-side plan checks enforce Business access.
7. Confirm downstream systems can ignore unknown optional fields safely.
8. Update `professional-platform-contracts` first if a new shared contract is required.
