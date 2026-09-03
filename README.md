# Growth Engine

Growth Engine is the internal implementation foundation for the future Business-plan growth layer of Professional Studio products. Business is currently not offered publicly.

Initial target:

- Professional Studio: Numeria Studio
- End user: independent fortune tellers using Numeria Studio
- Positioning: future Business-plan feature set inside Numeria Studio and Velvet, not a standalone public product

## Product Definition

Growth Engine connects SNS Planner, LINE, reservations, payments, customer data, and Professional Studio activity data to improve the funnel from awareness to referral.

It supports:

- lead acquisition
- SNS strategy
- LINE and form inflow
- lead and customer management
- reservations
- payments and revenue analysis
- repeat usage
- reviews and referrals
- AI-backed next-action suggestions

Growth Engine does not perform Professional Studio domain work. For Numeria Studio, fortune-telling calculations, readings, AI鑑定, reports, PDFs, and session history remain owned by Numeria Studio.

## Architecture

```text
Growth Engine
  Business growth: acquisition, sales, retention, referral
    |
Professional Studio
  Expert work: Numeria Studio / FP Studio / Coach Studio
    |
AI Platform Core
  Shared AI runtime, prompts, knowledge, usage, billing, events
```

Growth Engine and AI Platform Core are shared foundations. Industry-specific work belongs to each Professional Studio.

## Documentation

- [Growth Engine Requirements v1.0](docs/requirements-v1.0.md)
- [MVP Foundation Checklist](docs/mvp-foundation.md)
- [Phase 1 Implementation Notes](docs/phase-1-implementation.md)
- [Cloudflare Migration](docs/cloudflare-migration.md)
- [Production Persistence](docs/production-persistence.md)
- [Business Plan Preparation](docs/business-plan-preparation.md)

## Local Foundation Runtime

Copy `.env.example` for local development defaults. Local development can run with mock drivers, while Production runs on Cloudflare Workers with D1-backed Customer and Reservation persistence.

```text
GROWTH_REPOSITORY_DRIVER=mock
AUDIT_LOG_REPOSITORY_DRIVER=mock
EVENT_PUBLISHER_DRIVER=mock
```

Production uses:

```text
GROWTH_REPOSITORY_DRIVER=d1
```

## Connection Test APIs

- `GET /health`
- `GET /version`
- `GET /contracts/status`

## Core Principles

1. Growth Engine is for owned Professional Studio products.
2. The initial Professional Studio is Numeria Studio.
3. When Business is released, Growth Engine access requires the Business plan, an available offering state, and the enabled Business integration flag. Free and Pro do not unlock it.
4. Users see one app experience, not a separate Growth Engine app.
5. The UI should use everyday language such as 今日やること, 集客, お客様, 予約, 売上, フォロー, リピート, 紹介, AIからの提案.
6. Growth Engine must not duplicate SNS Planner content editing or asset management.
7. AI execution is delegated to AI Platform Core.
8. Customer is mastered by Growth Engine and referenced by Professional Studio via shared customerId.
9. Sensitive professional work data must not be copied freely for marketing use.
10. AI suggestions must show evidence and require user confirmation in the MVP.
