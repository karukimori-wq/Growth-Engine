# Contracts Reference

Growth Engine follows the shared contracts defined in the Professional Platform Contracts repository.

Source repository:

- https://github.com/karukimori-wq/professional-platform-contracts

This repository is the implementation repository for Growth Engine. It must not redefine shared platform language independently. Cross-product terms, APIs, events, entity payloads, and ownership rules must use the contracts repository as the source of truth.

## Required References

Read these documents before implementing cross-product behavior:

| Contract Document | Purpose |
| --- | --- |
| [Platform Boundaries](https://github.com/karukimori-wq/professional-platform-contracts/blob/main/docs/contracts/platform-boundaries.md) | Defines what Growth Engine owns and must not own |
| [Shared Glossary](https://github.com/karukimori-wq/professional-platform-contracts/blob/main/docs/contracts/shared-glossary.md) | Defines shared naming across Growth Engine, Professional Studio, SNS Planner, and AI Platform Core |
| [API Catalog](https://github.com/karukimori-wq/professional-platform-contracts/blob/main/docs/contracts/api-catalog.md) | Defines approved synchronous cross-system operations |
| [Event Catalog](https://github.com/karukimori-wq/professional-platform-contracts/blob/main/docs/contracts/event-catalog.md) | Defines approved asynchronous state-change events |
| [Data Ownership](https://github.com/karukimori-wq/professional-platform-contracts/blob/main/docs/contracts/data-ownership.md) | Defines canonical data ownership |
| [Adoption Guide](https://github.com/karukimori-wq/professional-platform-contracts/blob/main/docs/adoption-guide.md) | Explains how implementation repositories should adopt the contracts |
| [Contract Change Checklist](https://github.com/karukimori-wq/professional-platform-contracts/blob/main/docs/contract-change-checklist.md) | Checklist before changing shared contracts |

## Growth Engine Ownership

Growth Engine owns:

- canonical Customer data
- Lead data and lead status
- acquisition source
- contact and channel references
- sales flow state
- reservation business state
- customer nurturing state
- campaign intent
- Business plan feature rules
- next-action suggestions for acquisition, sales, repeat, and referral

Growth Engine does not own:

- Professional Studio domain calculations
- Numeria Studio reading, chart, or appraisal logic
- Report rendering and PDF layout internals
- AI Platform Core runtime internals
- SNS Planner post generation details

## Canonical Customer Rule

The canonical customer master belongs to Growth Engine.

Professional Studio repositories may reference `customerId` and store domain-specific records, but they must not create a separate customer master.

Growth Engine may share customer display or contact metadata through approved APIs and events. Sensitive Professional Studio data should only be exchanged through allowlisted fields, tags, categories, aggregated values, or anonymized information.

## Naming Rules

Use the shared glossary terms consistently:

| Use | Meaning |
| --- | --- |
| `Customer` | Growth Engine canonical customer |
| `Lead` | Customer before paid booking or confirmed business relationship |
| `Session` | Professional Studio work appointment or service session |
| `Report` | Professional Studio generated appraisal/report deliverable |
| `Workspace` | Tenant boundary |
| `Capability` | AI Platform Core named AI-enabled action |
| `Activity` | One execution of an AI capability or workflow |
| `Event` | Versioned state-change notification |

Avoid creating alternative root terms such as `Client` as a database master entity. If `Client` is used in UI copy, it must map back to `Customer` internally.

Use `Report` for Growth Engine, Event, API, and cross-repository contracts. If another repository keeps `Document` internally for legacy reasons, Growth Engine integration should still use `Report`.

## Approved External Names

Use these approved Professional Studio operation and event names when integrating with Numeria Studio or future studios:

- `Session.Start`
- `Session.Complete`
- `Report.Generate`
- `Report.Preview`
- `Report.ExportPdf`
- `studio.session.started.v1`
- `studio.session.completed.v1`
- `studio.report.generated.v1`
- `studio.service_reference.updated.v1`

Do not use these legacy names in cross-system contracts:

- `Session.Started`
- `Session.Completed`
- `Document.Generated`

Do not implement `studio.recommendation.created.v1` as a stable event yet. It is pending in the contracts repository.

## API and Event Rule

Use APIs for immediate reads, writes, and UI operations.

Use events for state changes and follow-up processing.

Do not replace API calls with events when the user needs an immediate result. Do not use APIs as the only mechanism when downstream systems must react to a state change.

## SNS Planner Boundary

Growth Engine decides the business purpose, target audience, offer, and CTA before requesting SNS Planner.

Growth Engine sends SNS Planner a post creation brief containing:

- `purpose`
- `targetAudience`
- `cta`
- `channel`
- `tone`
- `constraints`

SNS Planner returns post drafts and emits `sns.post_draft.created.v1` or `sns.post_draft.updated.v1` when draft state changes.

## Contract Versioning

The contracts repository currently defines version `0.1.0`.

Growth Engine implementation should record which contract version it is adopting. Breaking changes in shared ownership, required fields, or event meaning must be handled as major contract changes in the contracts repository first.

## Before Adding Cross-System Code

Before adding cross-system behavior in Growth Engine, check:

1. Does the behavior belong to Growth Engine according to platform boundaries?
2. Is the shared term already defined in the glossary?
3. Is there an approved API operation for synchronous behavior?
4. Is there an approved event for asynchronous state change?
5. Is the payload covered by a shared schema or allowlist?
6. Does the implementation avoid copying sensitive Professional Studio data without limits?
7. If the contract is missing, should the contracts repository be updated before Growth Engine code changes?
