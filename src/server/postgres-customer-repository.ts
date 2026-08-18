import type { Customer } from "@/domain/entities";
import { queryPostgres } from "@/server/postgres-db";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/server/repositories";

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

function removeUndefinedValues<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>;
}

async function ensureCustomerSchema() {
  schemaReady ??= queryPostgres(`
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
  `).then(async () => {
    await queryPostgres("CREATE INDEX IF NOT EXISTS growth_customers_workspace_idx ON growth_customers (workspace_id, created_at DESC)");
    await queryPostgres("CREATE UNIQUE INDEX IF NOT EXISTS growth_customers_workspace_customer_number_idx ON growth_customers (workspace_id, customer_number)");
  });

  return schemaReady;
}

export async function listPostgresCustomers(workspaceId: string): Promise<Customer[]> {
  await ensureCustomerSchema();

  const result = await queryPostgres<CustomerRow>(
    `
    SELECT *
    FROM growth_customers
    WHERE workspace_id = $1
    ORDER BY created_at DESC
    `,
    [workspaceId]
  );

  return result.rows.map(toCustomer);
}

export async function findPostgresCustomer(
  workspaceId: string,
  customerId: string
): Promise<Customer | undefined> {
  await ensureCustomerSchema();

  const result = await queryPostgres<CustomerRow>(
    `
    SELECT *
    FROM growth_customers
    WHERE workspace_id = $1
      AND id = $2
    LIMIT 1
    `,
    [workspaceId, customerId]
  );

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

  const result = await queryPostgres<CustomerRow>(
    `
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
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7::jsonb,
      $8,
      $9::jsonb,
      $10,
      $11,
      $12,
      $13,
      $14,
      $15,
      $16,
      $17,
      $18,
      $19,
      $20
    )
    RETURNING *
    `,
    [
      customer.id,
      customer.workspaceId,
      customer.leadId ?? null,
      customer.customerNumber,
      customer.name ?? null,
      customer.displayName,
      JSON.stringify(customer.contactInformation),
      customer.lineUserId ?? null,
      JSON.stringify(customer.snsAccounts),
      customer.sourceChannel ?? null,
      customer.sourceCampaignId ?? null,
      customer.sourceContentId ?? null,
      customer.referredByCustomerId ?? null,
      customer.customerStatus,
      customer.firstPurchaseAt ?? null,
      customer.lastPurchaseAt ?? null,
      customer.totalRevenue,
      customer.purchaseCount,
      customer.createdAt,
      customer.updatedAt
    ]
  );

  return toCustomer(result.rows[0]);
}

export async function updatePostgresCustomer(
  workspaceId: string,
  customerId: string,
  input: UpdateCustomerInput
): Promise<Customer | undefined> {
  await ensureCustomerSchema();

  const existingCustomer = await findPostgresCustomer(workspaceId, customerId);

  if (!existingCustomer) {
    return undefined;
  }

  const updatedCustomer: Customer = {
    ...existingCustomer,
    ...removeUndefinedValues(input),
    workspaceId,
    id: existingCustomer.id,
    customerNumber: existingCustomer.customerNumber,
    updatedAt: new Date().toISOString()
  };

  const result = await queryPostgres<CustomerRow>(
    `
    UPDATE growth_customers
    SET
      name = $1,
      display_name = $2,
      contact_information = $3::jsonb,
      line_user_id = $4,
      sns_accounts = $5::jsonb,
      source_channel = $6,
      source_campaign_id = $7,
      source_content_id = $8,
      referred_by_customer_id = $9,
      customer_status = $10,
      first_purchase_at = $11,
      last_purchase_at = $12,
      total_revenue = $13,
      purchase_count = $14,
      updated_at = $15
    WHERE workspace_id = $16
      AND id = $17
    RETURNING *
    `,
    [
      updatedCustomer.name ?? null,
      updatedCustomer.displayName,
      JSON.stringify(updatedCustomer.contactInformation),
      updatedCustomer.lineUserId ?? null,
      JSON.stringify(updatedCustomer.snsAccounts),
      updatedCustomer.sourceChannel ?? null,
      updatedCustomer.sourceCampaignId ?? null,
      updatedCustomer.sourceContentId ?? null,
      updatedCustomer.referredByCustomerId ?? null,
      updatedCustomer.customerStatus,
      updatedCustomer.firstPurchaseAt ?? null,
      updatedCustomer.lastPurchaseAt ?? null,
      updatedCustomer.totalRevenue,
      updatedCustomer.purchaseCount,
      updatedCustomer.updatedAt,
      workspaceId,
      customerId
    ]
  );

  return result.rows[0] ? toCustomer(result.rows[0]) : undefined;
}
