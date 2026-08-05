-- Growth Engine persistent storage draft.
-- This DDL mirrors docs/database-schema.md and keeps MVP identity scoped by
-- workspace_id + user_id. professional_id is intentionally not required.

create table if not exists workspaces (
  id text primary key,
  name text not null,
  owner_user_id text not null,
  professional_studio_type text not null,
  plan text not null check (plan in ('free', 'pro', 'business')),
  timezone text not null,
  currency text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists users (
  id text primary key,
  workspace_id text not null references workspaces(id),
  name text not null,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'member')),
  status text not null check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists leads (
  id text primary key,
  workspace_id text not null references workspaces(id),
  display_name text not null,
  source_channel text,
  source_campaign_id text,
  source_content_id text,
  sns_account text,
  line_user_id text,
  email text,
  phone text,
  status text not null check (
    status in (
      'new',
      'contacted',
      'line_registered',
      'consultation_requested',
      'consultation_booked',
      'considering',
      'won',
      'lost',
      'inactive'
    )
  ),
  interest_tags jsonb not null default '[]'::jsonb,
  concern_tags jsonb not null default '[]'::jsonb,
  score integer,
  assigned_user_id text references users(id),
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists customers (
  id text primary key,
  workspace_id text not null references workspaces(id),
  lead_id text references leads(id),
  customer_number text not null,
  name text,
  display_name text not null,
  contact_information jsonb not null default '{}'::jsonb,
  line_user_id text,
  sns_accounts jsonb not null default '{}'::jsonb,
  source_channel text,
  source_campaign_id text,
  source_content_id text,
  referred_by_customer_id text references customers(id),
  customer_status text not null check (customer_status in ('active', 'inactive', 'blocked')),
  first_purchase_at timestamptz,
  last_purchase_at timestamptz,
  total_revenue integer not null default 0,
  purchase_count integer not null default 0,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (workspace_id, customer_number)
);

create table if not exists products (
  id text primary key,
  workspace_id text not null references workspaces(id),
  professional_studio_type text not null,
  name text not null,
  description text,
  category text not null,
  price integer not null,
  duration_minutes integer not null,
  active boolean not null default true,
  professional_service_reference text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists reservations (
  id text primary key,
  workspace_id text not null references workspaces(id),
  lead_id text references leads(id),
  customer_id text references customers(id),
  product_id text not null references products(id),
  professional_studio_type text not null,
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  status text not null check (status in ('requested', 'confirmed', 'cancelled', 'completed', 'no_show')),
  source_channel text,
  campaign_id text,
  content_id text,
  payment_status text not null check (payment_status in ('unpaid', 'paid', 'refunded')),
  session_id text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists payments (
  id text primary key,
  workspace_id text not null references workspaces(id),
  created_by_user_id text not null references users(id),
  customer_id text not null references customers(id),
  reservation_id text references reservations(id),
  product_id text references products(id),
  payment_provider text not null check (payment_provider = 'stripe'),
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  amount integer not null,
  currency text not null,
  payment_status text not null check (
    payment_status in ('unpaid', 'pending', 'paid', 'cancelled', 'failed', 'refunded')
  ),
  refund_status text not null check (refund_status in ('none', 'partial', 'full')),
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists revenues (
  id text primary key,
  workspace_id text not null references workspaces(id),
  payment_id text not null references payments(id),
  customer_id text not null references customers(id),
  product_id text references products(id),
  campaign_id text,
  content_id text,
  source_channel text,
  amount integer not null,
  occurred_at timestamptz not null,
  revenue_type text not null check (revenue_type in ('new', 'repeat', 'referral')),
  created_at timestamptz not null
);

create table if not exists audit_logs (
  id text primary key,
  workspace_id text not null references workspaces(id),
  actor_user_id text not null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null
);

create table if not exists event_outbox (
  id text primary key,
  workspace_id text not null references workspaces(id),
  event_type text not null,
  source text not null check (source = 'growth-engine'),
  payload jsonb not null,
  correlation_id text,
  status text not null check (status in ('pending', 'published', 'failed')),
  attempts integer not null default 0,
  occurred_at timestamptz not null,
  published_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists processed_external_events (
  id text primary key,
  workspace_id text not null references workspaces(id),
  provider text not null check (provider in ('stripe', 'line', 'sns_planner', 'numeria', 'ai_platform_core')),
  external_event_id text not null,
  event_type text not null,
  processed_at timestamptz not null,
  created_at timestamptz not null,
  unique (workspace_id, provider, external_event_id)
);

create table if not exists integration_connections (
  id text primary key,
  workspace_id text not null references workspaces(id),
  provider text not null check (provider in ('numeria', 'sns_planner', 'ai_platform_core', 'line', 'stripe')),
  status text not null check (status in ('connected', 'disconnected', 'error')),
  encrypted_credentials text,
  last_checked_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists idx_workspaces_owner_user_id on workspaces(owner_user_id);
create index if not exists idx_users_workspace_email on users(workspace_id, email);
create index if not exists idx_leads_workspace_status_last_contact on leads(workspace_id, status, last_contact_at);
create index if not exists idx_leads_workspace_source_channel on leads(workspace_id, source_channel);
create index if not exists idx_customers_workspace_line_user on customers(workspace_id, line_user_id);
create index if not exists idx_customers_workspace_status_last_purchase on customers(workspace_id, customer_status, last_purchase_at);
create index if not exists idx_products_workspace_active on products(workspace_id, active);
create index if not exists idx_reservations_workspace_start on reservations(workspace_id, scheduled_start_at);
create index if not exists idx_reservations_workspace_customer on reservations(workspace_id, customer_id);
create index if not exists idx_payments_workspace_status_paid_at on payments(workspace_id, payment_status, paid_at);
create index if not exists idx_payments_workspace_stripe_intent on payments(workspace_id, stripe_payment_intent_id);
create index if not exists idx_payments_workspace_stripe_checkout on payments(workspace_id, stripe_checkout_session_id);
create index if not exists idx_revenues_workspace_occurred_at on revenues(workspace_id, occurred_at);
create index if not exists idx_revenues_workspace_campaign on revenues(workspace_id, campaign_id);
create index if not exists idx_revenues_workspace_content on revenues(workspace_id, content_id);
create index if not exists idx_audit_logs_workspace_occurred_at on audit_logs(workspace_id, occurred_at);
create index if not exists idx_event_outbox_status_created_at on event_outbox(status, created_at);
create index if not exists idx_event_outbox_workspace_status_created_at on event_outbox(workspace_id, status, created_at);
