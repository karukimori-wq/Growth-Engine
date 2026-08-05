# Growth Engine Contracts

Growth Engine adopts the shared contracts from:

- https://github.com/karukimori-wq/professional-platform-contracts

The contracts repository is the source of truth for cross-system terminology,
ownership, API operation names, event names, and shared schemas. Growth Engine
must not invent local cross-system contracts.

## Required References

Read these files before changing cross-product behavior:

- `docs/contracts/platform-boundaries.md`
- `docs/contracts/shared-glossary.md`
- `docs/contracts/api-catalog.md`
- `docs/contracts/event-catalog.md`
- `docs/contracts/data-ownership.md`
- `docs/repositories/growth-engine.md`
- `docs/repositories/numeria-studio.md`
- `docs/repositories/sns-planner.md`
- `docs/adoption-guide.md`

## Growth Engine Responsibility

Growth Engine owns:

- canonical Customer data
- Lead status and lifecycle
- acquisition source
- nurturing status
- campaign intent
- sales flow state
- reservation business state
- Stripe payment state for customer-facing appraisal payments
- revenue records and sales analysis
- public site business settings for customer acquisition and booking
- Business Plan feature rules
- business workflow decisions

Growth Engine must not own:

- Professional Studio appraisal logic
- Numeria Studio domain calculations
- Report rendering or PDF layout internals
- AI Platform Core runtime internals
- SNS Planner post generation details

## Customer Source Of Truth

The canonical Customer master belongs to Growth Engine.

Professional Studio repositories, including Numeria Studio, may reference
`customerId` and store domain-specific Session and Report records. They must not
create an independent customer master.

Growth Engine is responsible for:

- customer display profile
- contact references
- LINE and SNS references
- lead status
- acquisition source
- nurturing status

Professional Studio may keep cached display fields only as temporary or snapshot
data. Those fields are not canonical.

## MVP Identity Rule

MVP must not introduce `professionalId` as a required identifier.

Use:

- `workspaceId`: the practitioner's business space
- `userId`: the signed-in practitioner or staff user
- `ownerUserId`: the Workspace owner

Treat `professionalId` as a future extension for multiple brands, multiple
practitioners, or richer practitioner profile management.

Growth Engine Customer, Reservation, Payment, Public Site, and Sales records are
owned by `workspaceId`. Creation and operation audit fields may reference
`userId` or `ownerUserId`.

## Shared Terminology

Use the shared glossary terms:

| Term | Required Meaning |
| --- | --- |
| `Customer` | Growth Engine canonical customer |
| `Lead` | Customer before paid booking or confirmed relationship |
| `Session` | Professional service appointment or appraisal session |
| `Report` | Generated professional deliverable, including appraisal PDFs |
| `Workspace` | Tenant boundary |
| `Capability` | AI Platform Core named AI-enabled action |
| `Activity` | One AI capability or workflow execution |
| `Event` | Versioned state-change notification |

External contracts must use `Report`, not `Document`.

Approved Professional Studio API names are:

- `Report.Generate`
- `Report.Preview`
- `Report.ExportPdf`

Approved report event name:

- `studio.report.generated.v1`

Do not use `Document.Generate`, `Document.Preview`, `Document.ExportPdf`, or
`Document.Generated` in cross-system contracts.

## API Rules

Use APIs for synchronous behavior where the caller needs an immediate result.

Growth Engine may provide or call these approved operations:

- `Customer.Create`
- `Customer.Get`
- `Customer.Find`
- `Customer.UpdateStatus`
- `Reservation.Create`
- `Reservation.Get`
- `Payment.CheckoutCreate`
- `Payment.Get`
- `Payment.Refund`
- `Session.Start`
- `Session.Complete`
- `Report.Generate`
- `Report.Preview`
- `Report.ExportPdf`
- `ServiceReference.List`
- `PostDraft.Generate`
- `PostDraft.Rewrite`
- `PostTemplate.List`
- `Activity.Create`
- `Activity.Get`
- `Usage.List`
- `PromptTemplate.Render`

## Event Rules

Use events only for state-change notifications and downstream processing.

Growth Engine may publish:

- `growth.customer.created.v1`
- `growth.customer.updated.v1`
- `growth.lead.converted.v1`
- `growth.reservation.created.v1`
- `growth.reservation.cancelled.v1`
- `growth.payment.completed.v1`
- `growth.payment.refunded.v1`

Growth Engine may consume:

- `studio.session.started.v1`
- `studio.session.completed.v1`
- `studio.report.generated.v1`
- `studio.service_reference.updated.v1`
- `ai.activity.created.v1`
- `ai.activity.completed.v1`
- `ai.activity.failed.v1`
- `ai.usage.recorded.v1`
- `sns.post_draft.created.v1`
- `sns.post_draft.updated.v1`

Do not use legacy event names:

- `Session.Started`
- `Session.Completed`
- `Document.Generated`

`studio.recommendation.created.v1` is Pending in the contracts repository and
must not be implemented as a stable event.

## SNS Planner Boundary

Growth Engine owns business intent for SNS work.

Growth Engine decides:

- `purpose`
- `targetAudience`
- `cta`
- `channel`
- `tone`
- `constraints`

SNS Planner turns those inputs into post drafts. Growth Engine must not move
post text generation details into Growth Engine, and SNS Planner must not decide
business strategy.

## Payment Boundary

MVP supports Stripe only for customer-facing appraisal payments.

Growth Engine owns:

- Stripe Checkout and Payment Intent creation
- payment state
- unpaid, pending, paid, cancelled, failed, and refunded state management
- reservation-to-payment links
- customer-to-payment links
- revenue analysis
- payment completed and refunded events

Numeria Studio must not own payment methods, payment state, or revenue records.
It may reference `paymentStatus`, `reservationId`, `customerId`, and product or
service menu context from Growth Engine to decide whether a Session can start.

Do not implement bank transfer, PayPay, cash, external payment links, Coconala,
or other payment providers in MVP. Treat them as future extensions.

## Contract Change Rule

If Growth Engine needs a new shared API, event, field, or ownership rule, update
`professional-platform-contracts` first or in the same change batch.
