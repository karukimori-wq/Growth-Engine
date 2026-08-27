import type { Customer } from "@/domain/entities";
import { createD1Id, getD1Database } from "@/server/d1-db";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/server/repositories";

type CustomerRow = {
  id: string;
  workspace_id: string;
  lead_id: string | null;
  customer_number: string;
  name: string | null;
  display_name: string;
  contact_information: string;
  line_user_id: string | null;
  sns_accounts: string;
  source_channel: string | null;
  source_campaign_id: string | null;
  source_content_id: string | null;
  referred_by_customer_id: string | null;
  customer_status: Customer["customerStatus"];
  first_purchase_at: string | null;
  last_purchase_at: string | null;
  total_revenue: number;
  purchase_count: number;
  created_at: string;
  updated_at: string;
};

function parseRecord(value: string | null): Record<string, string> {
  if (!value) return {};
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
    firstPurchaseAt: row.first_purchase_at ?? undefined,
    lastPurchaseAt: row.last_purchase_at ?? undefined,
    totalRevenue: Number(row.total_revenue),
    purchaseCount: Number(row.purchase_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function requireD1() {
  const db = await getD1Database();
  if (!db) throw new Error("D1_NOT_AVAILABLE: Growth Engine DB binding is missing.");
  return db;
}

function createCustomerNumber() {
  return `C-${Date.now().toString().slice(-8)}`;
}

export async function listD1Customers(workspaceId: string): Promise<Customer[]> {
  const db = await requireD1();
  const result = await db.prepare("SELECT * FROM growth_customers WHERE workspace_id = ? ORDER BY created_at DESC").bind(workspaceId).all<CustomerRow>();
  return result.results.map(toCustomer);
}

export async function findD1Customer(workspaceId: string, customerId: string): Promise<Customer | undefined> {
  const db = await requireD1();
  const row = await db.prepare("SELECT * FROM growth_customers WHERE workspace_id = ? AND id = ? LIMIT 1").bind(workspaceId, customerId).first<CustomerRow>();
  return row ? toCustomer(row) : undefined;
}

export async function createD1Customer(input: CreateCustomerInput): Promise<Customer> {
  const db = await requireD1();
  const now = new Date().toISOString();
  const customer: Customer = {
    id: createD1Id("cus"),
    customerNumber: createCustomerNumber(),
    createdAt: now,
    updatedAt: now,
    ...input
  };

  await db.prepare(`INSERT INTO growth_customers (
    id, workspace_id, lead_id, customer_number, name, display_name, contact_information,
    line_user_id, sns_accounts, source_channel, source_campaign_id, source_content_id,
    referred_by_customer_id, customer_status, first_purchase_at, last_purchase_at,
    total_revenue, purchase_count, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      customer.id, customer.workspaceId, customer.leadId ?? null, customer.customerNumber,
      customer.name ?? null, customer.displayName, JSON.stringify(customer.contactInformation),
      customer.lineUserId ?? null, JSON.stringify(customer.snsAccounts), customer.sourceChannel ?? null,
      customer.sourceCampaignId ?? null, customer.sourceContentId ?? null, customer.referredByCustomerId ?? null,
      customer.customerStatus, customer.firstPurchaseAt ?? null, customer.lastPurchaseAt ?? null,
      customer.totalRevenue, customer.purchaseCount, customer.createdAt, customer.updatedAt
    ).run();

  return customer;
}

export async function updateD1Customer(workspaceId: string, customerId: string, input: UpdateCustomerInput): Promise<Customer | undefined> {
  const db = await requireD1();
  const existing = await findD1Customer(workspaceId, customerId);
  if (!existing) return undefined;

  const updated: Customer = {
    ...existing,
    ...Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)),
    workspaceId,
    id: existing.id,
    customerNumber: existing.customerNumber,
    updatedAt: new Date().toISOString()
  };

  await db.prepare(`UPDATE growth_customers SET
    name = ?, display_name = ?, contact_information = ?, line_user_id = ?, sns_accounts = ?,
    source_channel = ?, source_campaign_id = ?, source_content_id = ?, referred_by_customer_id = ?,
    customer_status = ?, first_purchase_at = ?, last_purchase_at = ?, total_revenue = ?,
    purchase_count = ?, updated_at = ? WHERE workspace_id = ? AND id = ?`)
    .bind(
      updated.name ?? null, updated.displayName, JSON.stringify(updated.contactInformation), updated.lineUserId ?? null,
      JSON.stringify(updated.snsAccounts), updated.sourceChannel ?? null, updated.sourceCampaignId ?? null,
      updated.sourceContentId ?? null, updated.referredByCustomerId ?? null, updated.customerStatus,
      updated.firstPurchaseAt ?? null, updated.lastPurchaseAt ?? null, updated.totalRevenue, updated.purchaseCount,
      updated.updatedAt, workspaceId, customerId
    ).run();

  return updated;
}
