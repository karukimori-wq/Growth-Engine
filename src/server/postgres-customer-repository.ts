import { sql } from "@vercel/postgres";
import type { Customer } from "@/domain/entities";
import type { CreateCustomerInput } from "@/server/repositories";

type CustomerRow = {
  id: string;
  workspace_id: string;
  lead_id: string | null;
  customer_number: string;
  name: string | null;
  display_name: string;
  contact_information: Record<string, string> | string | null;
  line_user_id: string | null;
  sns_accounts: Record<string, string> | string | null;
  source_channel: string | null;
  source_campaign_id: string | null;
  source_content_id: string | null;
  referred_by_customer_id: string | null;
  customer_status: Customer["customerStatus"];
  first_purchase_at: string | null;
  last_purchase_at: string | null;
  total_revenue: string | number;
  purchase_count: number;
  created_at: string;
  updated_at: string;
};

let schemaReady: Promise<void> | undefined;

function createCustomerId() {
  return `cus_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createCustomerNumber() {
  return `C-${Date.now().toString().slice(-8)}`;
}

function toIso(value: string | Date | null | undefined) {
  return value ? new Date(value).toISOString() : undefined;
}

function parseRecord(value: Record<string, string> | string | null): Record<string, string> {
  if (!value) {
    return {};
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return {};
  }
}

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    leadId: row.lead_id ?? undefined,
    customerNumber: row.customer_number,
    name: row.name ?? undefined,
    displayName: row.display_name,
    contactInformation: parseRecord(row.contact_information),
    lineUserId: row.line_user_id ?? undefined,
    snsAccounts: parseRecord(row.sns_accounts),
    sourceChannel: row.source_channel ?? undefined,
    sourceCampaignId: row.source_campaign_id ?? undefined,
    sourceContentId: row.source_content_id ?? undefined,
    referredByCustomerId: row.referred_by_customer_id ?? undefined,
    customerStatus: row.customer_status,
    firstPurchaseAt: toIso(row.first_purchase_at),
    lastPurchaseAt: toIso(row.last_purchase_at),
    totalRevenue: Number(row.total_revenue),
    purchaseCount: row.purchase_count,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

async function ensureCustomerSchema() {
  schemaReady ??= sql`
    CREATE TABLE IF NOT EXISTS growth_customers (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      lead_id TEXT,
      customer_number TEXT NOT NULL,
      name TEXT,
      display_name TEXT NOT NULL,
      contact_information JSONB NOT NULL DEFAULT '{}'::jsonb,
      line_user_id TEXT,
      sns_accounts JSONB NOT NULL DEFAULT '{}'::jsonb,
      source_channel TEXT,
      source_campaign_id TEXT,
      source_content_id TEXT,
      referred_by_customer_id TEXT,
      customer_status TEXT NOT NULL,
      first_purchase_at TIMESTAMPTZ,
      last_purchase_at TIMESTAMPTZ,
      total_revenue NUMERIC NOT NULL DEFAULT 0,
      purchase_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `.then(async () => {
    await sql`CREATE INDEX IF NOT EXISTS growth_customers_workspace_idx ON growth_customers (workspace_id, created_at DESC)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS growth_customers_workspace_customer_number_idx ON growth_customers (workspace_id, customer_number)`;
  });

  return schemaReady;
}

export async function listPostgresCustomers(workspaceId: string): Promise<Customer[]> {
  await ensureCustomerSchema();

  const result = await sql<CustomerRow>`
    SELECT *
    FROM growth_customers
    WHERE workspace_id = ${workspaceId}
    ORDER BY created_at DESC
  `;

  return result.rows.map(toCustomer);
}

export async function findPostgresCustomer(
  workspaceId: string,
  customerId: string
): Promise<Customer | undefined> {
  await ensureCustomerSchema();

  const result = await sql<CustomerRow>`
    SELECT *
    FROM growth_customers
    WHERE workspace_id = ${workspaceId}
      AND id = ${customerId}
    LIMIT 1
  `;

  return result.rows[0] ? toCustomer(result.rows[0]) : undefined;
}

export async function createPostgresCustomer(input: CreateCustomerInput): Promise<Customer> {
  await ensureCustomerSchema();

  const now = new Date().toISOString();
  const customer: Customer = {
    id: createCustomerId(),
    customerNumber: createCustomerNumber(),
    createdAt: now,
    updatedAt: now,
    ...input
  };

  const result = await sql<CustomerRow>`
    INSERT INTO growth_customers (
      id,
      workspace_id,
      lead_id,
      customer_number,
      name,
      display_name,
      contact_information,
      line_user_id,
      sns_accounts,
      source_channel,
      source_campaign_id,
      source_content_id,
      referred_by_customer_id,
      customer_status,
      first_purchase_at,
      last_purchase_at,
      total_revenue,
      purchase_count,
      created_at,
      updated_at
    ) VALUES (
      ${customer.id},
      ${customer.workspaceId},
      ${customer.leadId ?? null},
      ${customer.customerNumber},
      ${customer.name ?? null},
      ${customer.displayName},
      ${JSON.stringify(customer.contactInformation)}::jsonb,
      ${customer.lineUserId ?? null},
      ${JSON.stringify(customer.snsAccounts)}::jsonb,
      ${customer.sourceChannel ?? null},
      ${customer.sourceCampaignId ?? null},
      ${customer.sourceContentId ?? null},
      ${customer.referredByCustomerId ?? null},
      ${customer.customerStatus},
      ${customer.firstPurchaseAt ?? null},
      ${customer.lastPurchaseAt ?? null},
      ${customer.totalRevenue},
      ${customer.purchaseCount},
      ${customer.createdAt},
      ${customer.updatedAt}
    )
    RETURNING *
  `;

  return toCustomer(result.rows[0]);
}
