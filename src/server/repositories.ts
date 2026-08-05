import type { Customer, Lead, Product, Reservation } from "@/domain/entities";
import { customers, leads, products, todayReservations } from "@/lib/mock-data";

function filterByWorkspace<T extends { workspaceId: string }>(records: T[], workspaceId: string): T[] {
  return records.filter((record) => record.workspaceId === workspaceId);
}

export async function listLeads(workspaceId: string): Promise<Lead[]> {
  return filterByWorkspace(leads, workspaceId);
}

export async function findLead(workspaceId: string, leadId: string): Promise<Lead | undefined> {
  return leads.find((lead) => lead.workspaceId === workspaceId && lead.id === leadId);
}

export async function createLead(input: Omit<Lead, "id" | "createdAt" | "updatedAt">): Promise<Lead> {
  const now = new Date().toISOString();

  return {
    id: `lead_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    ...input
  };
}

export async function listCustomers(workspaceId: string): Promise<Customer[]> {
  return filterByWorkspace(customers, workspaceId);
}

export async function findCustomer(workspaceId: string, customerId: string): Promise<Customer | undefined> {
  return customers.find((customer) => customer.workspaceId === workspaceId && customer.id === customerId);
}

export async function createCustomer(input: Omit<Customer, "id" | "customerNumber" | "createdAt" | "updatedAt">): Promise<Customer> {
  const now = new Date().toISOString();

  return {
    id: `cus_${Date.now()}`,
    customerNumber: `C-${Date.now().toString().slice(-6)}`,
    createdAt: now,
    updatedAt: now,
    ...input
  };
}

export async function convertLeadToCustomer(workspaceId: string, lead: Lead): Promise<Customer> {
  return createCustomer({
    workspaceId,
    leadId: lead.id,
    displayName: lead.displayName,
    contactInformation: {
      ...(lead.email ? { email: lead.email } : {}),
      ...(lead.phone ? { phone: lead.phone } : {})
    },
    lineUserId: lead.lineUserId,
    snsAccounts: lead.snsAccount ? { primary: lead.snsAccount } : {},
    sourceChannel: lead.sourceChannel,
    sourceCampaignId: lead.sourceCampaignId,
    sourceContentId: lead.sourceContentId,
    customerStatus: "active",
    totalRevenue: 0,
    purchaseCount: 0
  });
}

export async function listProducts(workspaceId: string): Promise<Product[]> {
  return filterByWorkspace(products, workspaceId);
}

export async function findProduct(workspaceId: string, productId: string): Promise<Product | undefined> {
  return products.find((product) => product.workspaceId === workspaceId && product.id === productId);
}

export async function listReservations(workspaceId: string): Promise<Reservation[]> {
  return filterByWorkspace(todayReservations, workspaceId);
}

export async function createReservation(input: Omit<Reservation, "id" | "createdAt" | "updatedAt">): Promise<Reservation> {
  const now = new Date().toISOString();

  return {
    id: `res_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    ...input
  };
}
