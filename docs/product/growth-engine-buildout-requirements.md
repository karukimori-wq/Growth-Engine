# Growth Engine Buildout Requirements

Status: active
Last updated: 2026-08-12
Scope: Growth Engine product and screen buildout

This document is the implementation reference for completing Growth Engine. It exists to avoid repeating product direction across separate implementation tasks.

## Core Positioning

Growth Engine is the shared Business layer for Professional Apps.

Growth Engine must not be implemented as a Numeria Studio-only app. It must support multiple Professional Apps, starting with:

- Numeria Studio
- Velvet

Future Professional Apps must be addable without rebuilding the Business menu structure.

## Top-Level Menu Model

Growth Engine navigation is divided into two major areas:

1. Professional
2. Business

### Professional

Professional is the area where each Professional App performs its domain-specific work.

The contents change by Professional App.

Examples:

- Numeria Studio: appraisal sessions and Reports
- Velvet: visits, customer-facing work records, and service notes

Professional App-specific screens must be driven by a `studioKey` / app registry pattern rather than hard-coded only for Numeria Studio.

Recommended URL model:

```text
/app/professional/[studioKey]
/app/professional/numeria
/app/professional/velvet
```

Recommended app registry shape:

```ts
type ProfessionalApp = {
  studioKey: string
  studioName: string
  professionalMenu: Array<{
    label: string
    href: string
    status?: 'ready' | 'mvp' | 'coming_soon'
  }>
}
```

### Professional Menu Definitions

| Menu | App | Description |
| --- | --- | --- |
| 顧客 | Common / per Professional App | Customer reference screen used by Professional Apps. Customer source of truth remains Growth Engine. Professional Apps may view only the reference information needed for domain work. |
| 新しい鑑定 | Numeria Studio | Starts a Numeria Studio appraisal Session by carrying reservation and customer reference IDs. |
| 鑑定履歴 | Numeria Studio | Displays past appraisal Sessions and Report references. MVP may be `coming_soon`, but must not 404. |
| 来店履歴 | Velvet | Handles visit dates, service history, and notes for Velvet-specific professional work. |
| メモ | Velvet | Handles customer-specific service notes and records for Velvet. |

## Business

Business is the shared Growth Engine area.

Business menus are common across Numeria Studio, Velvet, and future Professional Apps.

Business must not be duplicated inside each Professional App.

Recommended URL model:

```text
/app/business
/app/business/today
/app/business/marketing
/app/business/prospects
/app/business/reservations
/app/business/sales
/app/business/repeat
/app/business/referrals
/app/business/analytics
```

### Business Menu Definitions

| Menu | Description |
| --- | --- |
| 今日やること | Home screen. Shows today's reservations, unattended prospects, follow-up targets, and AI suggestions. Use practical wording; avoid hard business terms such as COO or management jargon. |
| 集客 | Manages campaign ideas, post themes, SNS Planner post-draft requests, and inbound paths. |
| 見込み客 | Manages people who are not yet confirmed customers. Tracks source, interest tags, status, and next action. |
| 予約 | Manages reservation list and reservation detail. Reservation detail can start Numeria Studio appraisal when the selected Professional App is Numeria. |
| 売上 | Shows Stripe payments and sales summaries. Growth Engine is the source of truth for sales and payment state. |
| リピート | Shows repeat-use candidates, last-use date, next contact, and follow-up targets. |
| 紹介 | Manages referral requests, referrer/referee references, and referral outcomes. |
| 分析 | Shows funnel, traffic source, post, product, customer, and repeat analysis. |

## Current Implementation Status

Many screens are not complete yet. When a screen is not implemented, it must show a stable MVP placeholder instead of a 404.

| Area | Menu / Feature | Current State | Notes |
| --- | --- | --- | --- |
| Common | Professional App Registry | Done | Numeria Studio and Velvet can be represented as switchable Professional Apps. |
| Common | Professional App Home | Mostly done | `/app/professional/numeria` and `/app/professional/velvet` should render. |
| Business | 今日やること | MVP implemented | Can act as the home. May include mocked sales, new customers, repeat, priority tasks, and AI suggestions. |
| Business | 予約 | MVP implemented | Reservation list, detail, public booking page, and confirmation page exist. Persistence still needs production hardening. |
| Business | Reservation detail to Numeria start | MVP implemented | For Numeria, should link to Numeria Studio `/app/growth/start` with reference IDs only. |
| Business | SNS Planner integration | API test implemented | Post-draft request API is tested. UI is still MVP-level. |
| Business | AI Platform Core integration | API test implemented | AI Activity test is implemented. Production UI is thin. |
| Business | Stripe payment | MVP verified | Test-mode Checkout, webhook, and paymentStatus update have been verified. UI is limited. |
| Business | 集客 | Placeholder / partial | Has post brief and SNS Planner entry point but is not a full campaign management screen. |
| Business | 見込み客 | coming_soon | Must not 404. |
| Business | 売上 | coming_soon | Must not 404. Aggregation UI not implemented. |
| Business | リピート | coming_soon / partial | Follow-up path exists, but repeat management is not complete. |
| Business | 紹介 | coming_soon | Must not 404. |
| Business | 分析 | coming_soon | Must not 404. |
| Professional / Numeria | 顧客 | Placeholder / incomplete | Customer source of truth is Growth Engine. Professional view still needs real implementation. |
| Professional / Numeria | 新しい鑑定 | Handoff only | Growth Engine should not perform appraisal; it should hand off to Numeria Studio. |
| Professional / Numeria | 鑑定履歴 | coming_soon | Must not 404. |
| Professional / Velvet | 顧客 | coming_soon | Must not 404. |
| Professional / Velvet | 来店履歴 | coming_soon | Must not 404. |
| Professional / Velvet | メモ | coming_soon | Must not 404. |

## Required Screen Behavior

### No 404 for MVP Menu Items

The following routes must not return 404. If not implemented, they must render a `coming_soon` screen.

```text
/app/professional/numeria
/app/professional/numeria/customers
/app/professional/numeria/sessions/new
/app/professional/numeria/history
/app/professional/velvet
/app/professional/velvet/customers
/app/professional/velvet/visits
/app/professional/velvet/notes
/app/business
/app/business/today
/app/business/marketing
/app/business/prospects
/app/business/reservations
/app/business/sales
/app/business/repeat
/app/business/referrals
/app/business/analytics
```

### Home Screen

The simple app menu screen should be treated as the MVP home.

It should show:

- active Professional App title, such as `Numeria Studio` or `Velvet`
- Professional menu for the active app
- shared Business menu

The page must not be hard-coded as Numeria-only. Use `studioKey`, `studioName`, `professionalMenu`, and `businessMenu` style data separation.

### Reservation Confirmation Link

The booking confirmation screen must not send the user back to the reservation input page when they tap reservation confirmation.

Expected behavior:

- Public customer confirmation page should provide safe public actions only:
  - return to booking page
  - return to top/public page
  - display reservation details in readable Japanese
- Business-side reservation confirmation should link to:
  - `/app/business/reservations`
  - `/app/business/reservations/[reservationId]`

Public pages must not expose business/admin links to general customers.

## Reservation Persistence Requirement

This is the most important unfinished item.

Current state:

- Reservation persistence is not production-grade.
- Current implementation may rely on mock repository and cookie-backed store.
- This is acceptable for same-browser MVP smoke checks only.
- It is not acceptable for production operation, another browser, another device, or multiple users.

Required implementation:

1. `POST /api/public/bookings` must create a canonical Reservation in Growth Engine.
2. `/app/business/reservations` must display reservations from the same canonical Reservation source.
3. `/app/business/reservations/[reservationId]` must open reservation detail for the created reservation.
4. Public booking and Business reservation screens must use the same repository / data source.
5. The implementation must not depend only on fixed mock IDs such as `res_001`.
6. `workspaceId` and `ownerUserId` filtering must not hide newly created valid reservations.

Production direction:

- Move reservations to a database-backed repository.
- Keep mock data only as seed/demo data.
- Use the database as Growth Engine's Reservation source of truth.

## Data Ownership

Growth Engine is the source of truth for:

- Customer
- Reservation
- Payment
- Sales
- Public Site
- Business common menu

Professional Apps own their domain work:

- Numeria Studio: Session and Report
- Velvet: visits and service notes

Growth Engine must not perform Numeria appraisal logic or Report generation.

Growth Engine must not perform Velvet's specialized professional work beyond shared Business and canonical Customer/Reservation/Payment/Sales ownership.

## Data Safety

Do not send unnecessary sensitive or business-owned fields to Professional Apps.

Do not send the following outside Growth Engine unless explicitly approved by shared contract:

- `paymentStatus`
- `salesAmount`
- Stripe secrets
- full customer records
- confidential notes
- full Report contents
- full chart contents
- `fullMeetingTranscript`
- API keys
- access tokens
- secret prompts

Numeria Studio handoff must use reference IDs only:

```text
workspaceId
userId
reservationId
customerId
intent
```

Velvet handoff must also use only the minimum references required for the target screen.

## Implementation Priority

1. Database-backed reservation persistence
2. Reservation list and detail using production data
3. Customer management
4. Sales and payment screens
5. Prospects
6. Marketing / SNS Planner UI
7. Repeat / follow-up
8. Analytics / referrals
9. Velvet professional screens
10. Numeria history integration

## Definition of Done for Next Growth Engine Buildout

The next Growth Engine buildout is not complete until all of the following are true:

- Public booking creates a reservation in the canonical repository.
- The new reservation appears in `/app/business/reservations`.
- The new reservation detail opens at `/app/business/reservations/[reservationId]`.
- Numeria reservation detail handoff opens Numeria Studio `/app/growth/start`.
- The menu home supports at least `numeria` and `velvet` through a registry-style setup.
- No current MVP menu item returns 404.
- Coming soon screens are used for unfinished menu items.
- Public booking confirmation does not route users back to the input page when they expect reservation confirmation.
- Public pages do not expose business/admin-only links.
- No disallowed fields are sent to Professional Apps.
