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
