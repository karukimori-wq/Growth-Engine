PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS growth_customers (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  lead_id TEXT,
  customer_number TEXT NOT NULL,
  name TEXT,
  display_name TEXT NOT NULL,
  contact_information TEXT NOT NULL DEFAULT '{}',
  line_user_id TEXT,
  sns_accounts TEXT NOT NULL DEFAULT '{}',
  source_channel TEXT,
  source_campaign_id TEXT,
  source_content_id TEXT,
  referred_by_customer_id TEXT,
  customer_status TEXT NOT NULL,
  first_purchase_at TEXT,
  last_purchase_at TEXT,
  total_revenue REAL NOT NULL DEFAULT 0,
  purchase_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS growth_customers_workspace_idx
  ON growth_customers (workspace_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS growth_customers_workspace_customer_number_idx
  ON growth_customers (workspace_id, customer_number);

CREATE TABLE IF NOT EXISTS growth_reservations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  lead_id TEXT,
  customer_id TEXT,
  product_id TEXT NOT NULL,
  professional_studio_type TEXT NOT NULL,
  scheduled_start_at TEXT NOT NULL,
  scheduled_end_at TEXT NOT NULL,
  status TEXT NOT NULL,
  source_channel TEXT,
  campaign_id TEXT,
  content_id TEXT,
  payment_status TEXT NOT NULL,
  session_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS growth_reservations_workspace_idx
  ON growth_reservations (workspace_id, scheduled_start_at DESC);
CREATE INDEX IF NOT EXISTS growth_reservations_customer_idx
  ON growth_reservations (workspace_id, customer_id);

CREATE TABLE IF NOT EXISTS growth_persistence_roundtrip (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS growth_roundtrip_scope_idx
  ON growth_persistence_roundtrip (workspace_id, user_id, created_at DESC);

-- Professional Platform SaaS subscription entitlement projection.
-- This is separate from customer reservation/service payments and contains no card/payment details.
CREATE TABLE IF NOT EXISTS platform_subscriptions (
  workspace_id TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  product_code TEXT NOT NULL CHECK (product_code IN ('numeria-studio', 'velvet')),
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'pro')),
  subscription_status TEXT NOT NULL CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  entitlement_status TEXT NOT NULL CHECK (entitlement_status IN ('active', 'inactive', 'past_due', 'canceled')),
  valid_until TEXT,
  entitlement_ref TEXT NOT NULL,
  stripe_customer_ref TEXT,
  stripe_subscription_ref TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, owner_user_id, product_code)
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_subscriptions_entitlement_ref_idx
  ON platform_subscriptions (entitlement_ref);
CREATE INDEX IF NOT EXISTS platform_subscriptions_product_status_idx
  ON platform_subscriptions (product_code, subscription_status, updated_at DESC);
