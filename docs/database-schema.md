# Growth Engine Database Schema

This document defines the first persistent storage shape for Growth Engine.

The current implementation still uses mock repositories. The schema below is the
target for replacing those repositories with database-backed storage.

## Principles

- Every tenant-owned table includes `workspace_id`.
- Growth Engine owns canonical Customer records.
- MVP identity uses `workspace_id + user_id`; `professional_id` is not required.
- Numeria Studio references `customer_id`, `reservation_id`, `product_id`, and
  `session_id`; it does not own the Customer master.
- External integration names use `Report`, not `Document`.
- Versioned event names are stored exactly as contract names.
- Sensitive Professional Studio content is not copied into Growth Engine tables
  unless explicitly allowlisted by contracts.
- Payment card data is never stored.
- MVP supports Stripe only for customer-facing appraisal payments.
- Bank transfer, PayPay, cash, external payment links, Coconala, and other
  providers are future extensions.

## Identity Rule

MVP does not create or require `professional_id`.

Use:

- `workspace_id`: business space owned by the practitioner
- `user_id`: signed-in practitioner or staff user
- `owner_user_id`: Workspace owner

Customer, Reservation, Payment, Public Site, and Sales records are primarily
owned by `workspace_id`. Creation and audit columns may reference the acting
`user_id`.

`professional_id` is reserved for future multiple-brand, multiple-practitioner,
or richer practitioner profile support.

## Core Tables

### workspaces

| Column | Type | Notes |
| --- | --- | --- |
| id | text primary key | Workspace boundary |
| name | text | Display name |
| owner_user_id | text | Owner user |
| professional_studio_type | text | `numeria`, future `fp`, `coach` |
| plan | text | `free`, `pro`, `business` |
| timezone | text | Example: `Asia/Tokyo` |
| currency | text | Example: `JPY` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### users

| Column | Type | Notes |
| --- | --- | --- |
| id | text primary key | |
| workspace_id | text not null | FK to `workspaces.id` |
| name | text | |
| email | text | |
| role | text | `owner`, `admin`, `member` |
| status | text | `active`, `invited`, `disabled` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### leads

| Column | Type | Notes |
| --- | --- | --- |
| id | text primary key | |
| workspace_id | text not null | |
| display_name | text not null | |
| source_channel | text | |
| source_campaign_id | text | |
| source_content_id | text | |
| sns_account | text | |
| line_user_id | text | |
| email | text | |
| phone | text | |
| status | text | Lead lifecycle |
| interest_tags | jsonb | Array of strings |
| concern_tags | jsonb | Array of strings |
| score | integer | Assistant signal only, not final judgement |
| assigned_user_id | text | |
| first_contact_at | timestamptz | |
| last_contact_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### customers

| Column | Type | Notes |
| --- | --- | --- |
| id | text primary key | Canonical Customer ID |
| workspace_id | text not null | |
| lead_id | text | Original lead |
| customer_number | text not null | Human-readable number |
| name | text | Optional legal or real name |
| display_name | text not null | User-facing name |
| contact_information | jsonb | Email, phone, and contact references |
| line_user_id | text | |
| sns_accounts | jsonb | SNS account references |
| source_channel | text | |
| source_campaign_id | text | |
| source_content_id | text | |
| referred_by_customer_id | text | Self-reference |
| customer_status | text | `active`, `inactive`, `blocked` |
| first_purchase_at | timestamptz | |
| last_purchase_at | timestamptz | |
| total_revenue | integer | Minor unit amount |
| purchase_count | integer | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### products

| Column | Type | Notes |
| --- | --- | --- |
| id | text primary key | |
| workspace_id | text not null | |
| professional_studio_type | text | |
| name | text not null | |
| description | text | |
| category | text | |
| price | integer | Minor unit amount |
| duration_minutes | integer | |
| active | boolean | |
| professional_service_reference | text | Numeria service reference |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### reservations

| Column | Type | Notes |
| --- | --- | --- |
| id | text primary key | |
| workspace_id | text not null | |
| lead_id | text | |
| customer_id | text | Canonical Growth Engine customer |
| product_id | text not null | |
| professional_studio_type | text | |
| scheduled_start_at | timestamptz | |
| scheduled_end_at | timestamptz | |
| status | text | `requested`, `confirmed`, `cancelled`, `completed`, `no_show` |
| source_channel | text | |
| campaign_id | text | |
| content_id | text | |
| payment_status | text | `unpaid`, `paid`, `refunded` |
| session_id | text | Professional Studio session reference |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### payments

| Column | Type | Notes |
| --- | --- | --- |
| id | text primary key | |
| workspace_id | text not null | |
| created_by_user_id | text not null | Signed-in user who created the checkout |
| customer_id | text not null | |
| reservation_id | text | |
| product_id | text | |
| payment_provider | text | `stripe` only in MVP |
| stripe_payment_intent_id | text | Stripe Payment Intent ID |
| stripe_checkout_session_id | text | Stripe Checkout Session ID |
| amount | integer | Minor unit amount |
| currency | text | |
| payment_status | text | `unpaid`, `pending`, `paid`, `cancelled`, `failed`, `refunded` |
| refund_status | text | `none`, `partial`, `full` |
| paid_at | timestamptz | |
| refunded_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### revenues

| Column | Type | Notes |
| --- | --- | --- |
| id | text primary key | |
| workspace_id | text not null | |
| payment_id | text not null | |
| customer_id | text not null | |
| product_id | text | |
| campaign_id | text | |
| content_id | text | |
| source_channel | text | |
| amount | integer | Minor unit amount |
| occurred_at | timestamptz | |
| revenue_type | text | `new`, `repeat`, `referral` |
| created_at | timestamptz | |

## Operational Tables

### audit_logs

| Column | Type | Notes |
| --- | --- | --- |
| id | text primary key | |
| workspace_id | text not null | |
| actor_user_id | text not null | |
| action | text not null | |
| target_type | text not null | |
| target_id | text | |
| metadata | jsonb | Minimal contextual data |
| occurred_at | timestamptz | |

### event_outbox

| Column | Type | Notes |
| --- | --- | --- |
| id | text primary key | |
| workspace_id | text not null | |
| event_type | text not null | Contract event name |
| source | text not null | `growth-engine` |
| payload | jsonb not null | |
| correlation_id | text | |
| status | text | `pending`, `published`, `failed` |
| attempts | integer | |
| occurred_at | timestamptz | |
| published_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### integration_connections

| Column | Type | Notes |
| --- | --- | --- |
| id | text primary key | |
| workspace_id | text not null | |
| provider | text not null | `numeria`, `sns_planner`, `ai_platform_core`, `line`, `stripe` |
| status | text not null | `connected`, `disconnected`, `error` |
| encrypted_credentials | text | Optional, never plain text |
| last_checked_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## Indexes

- `workspaces(owner_user_id)`
- `users(workspace_id, email)`
- `leads(workspace_id, status, last_contact_at)`
- `leads(workspace_id, source_channel)`
- `customers(workspace_id, customer_number)`
- `customers(workspace_id, line_user_id)`
- `customers(workspace_id, customer_status, last_purchase_at)`
- `products(workspace_id, active)`
- `reservations(workspace_id, scheduled_start_at)`
- `reservations(workspace_id, customer_id)`
- `payments(workspace_id, status, paid_at)`
- `revenues(workspace_id, occurred_at)`
- `revenues(workspace_id, campaign_id)`
- `revenues(workspace_id, content_id)`
- `audit_logs(workspace_id, occurred_at)`
- `event_outbox(status, created_at)`

## Next Implementation Step

Replace `src/server/repositories.ts` with database-backed implementations while
keeping the same function boundary for API routes.
