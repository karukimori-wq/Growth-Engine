import type { Customer, Lead, Payment, Product, Reservation, Revenue } from "@/domain/entities";
import {
  customers,
  leads,
  payments,
  processedStripeWebhookEventIds,
  products,
  revenues,
  todayReservations
} from "@/lib/mock-data";

function filterByWorkspace<T extends { workspaceId: string }>(records: T[], workspaceId: string): T[] {
  return records.filter((record) => record.workspaceId === workspaceId);
}

function replaceById<T extends { id: string }>(records: T[], updatedRecord: T): T {
  const index = records.findIndex((record) => record.id === updatedRecord.id);

  if (index >= 0) {
    records[index] = updatedRecord;
  }

  return updatedRecord;
}

export async function listLeads(workspaceId: string): Promise<Lead[]> {
  return filterByWorkspace(leads, workspaceId);
}

export async function findLead(workspaceId: string, leadId: string): Promise<Lead | undefined> {
  return leads.find((lead) => lead.workspaceId === workspaceId && lead.id === leadId);
}

export async function createLead(input: Omit<Lead, "id" | "createdAt" | "updatedAt">): Promise<Lead> {
  const now = new Date().toISOString();
  const lead = {
    id: `lead_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    ...input
  };

  leads.push(lead);
  return lead;
}

export async function listCustomers(workspaceId: string): Promise<Customer[]> {
  return filterByWorkspace(customers, workspaceId);
}

export async function findCustomer(workspaceId: string, customerId: string): Promise<Customer | undefined> {
  return customers.find((customer) => customer.workspaceId === workspaceId && customer.id === customerId);
}

export async function createCustomer(input: Omit<Customer, "id" | "customerNumber" | "createdAt" | "updatedAt">): Promise<Customer> {
  const now = new Date().toISOString();
  const customer = {
    id: `cus_${Date.now()}`,
    customerNumber: `C-${Date.now().toString().slice(-6)}`,
    createdAt: now,
    updatedAt: now,
    ...input
  };

  customers.push(customer);
  return customer;
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

export async function findReservation(workspaceId: string, reservationId: string): Promise<Reservation | undefined> {
  return todayReservations.find(
    (reservation) => reservation.workspaceId === workspaceId && reservation.id === reservationId
  );
}

export async function createReservation(input: Omit<Reservation, "id" | "createdAt" | "updatedAt">): Promise<Reservation> {
  const now = new Date().toISOString();
  const reservation = {
    id: `res_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    ...input
  };

  todayReservations.push(reservation);
  return reservation;
}

export async function updateReservationPaymentStatus(
  workspaceId: string,
  reservationId: string | undefined,
  paymentStatus: Reservation["paymentStatus"]
): Promise<Reservation | undefined> {
  if (!reservationId) {
    return undefined;
  }

  const reservation = await findReservation(workspaceId, reservationId);

  if (!reservation) {
    return undefined;
  }

  return replaceById(todayReservations, {
    ...reservation,
    paymentStatus,
    updatedAt: new Date().toISOString()
  });
}

export async function listPayments(workspaceId: string): Promise<Payment[]> {
  return filterByWorkspace(payments, workspaceId);
}

export async function findPaymentByStripePaymentIntent(
  workspaceId: string,
  stripePaymentIntentId: string
): Promise<Payment | undefined> {
  return payments.find(
    (payment) => payment.workspaceId === workspaceId && payment.stripePaymentIntentId === stripePaymentIntentId
  );
}

export async function createPayment(input: Omit<Payment, "id" | "createdAt" | "updatedAt">): Promise<Payment> {
  const now = new Date().toISOString();
  const payment = {
    id: `pay_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    ...input
  };

  payments.push(payment);
  return payment;
}

export async function markPaymentPaid(payment: Payment, paidAt: string): Promise<Payment> {
  return replaceById(payments, {
    ...payment,
    paymentStatus: "paid",
    paidAt,
    updatedAt: new Date().toISOString()
  });
}

export async function markPaymentRefunded(
  payment: Payment,
  refundStatus: "partial" | "full",
  refundedAt: string
): Promise<Payment> {
  return replaceById(payments, {
    ...payment,
    paymentStatus: "refunded",
    refundStatus,
    refundedAt,
    updatedAt: new Date().toISOString()
  });
}

export async function createRevenue(input: Omit<Revenue, "id" | "createdAt">): Promise<Revenue> {
  const revenue = {
    id: `rev_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...input
  };

  revenues.push(revenue);
  return revenue;
}

export async function hasProcessedStripeWebhookEvent(eventId: string): Promise<boolean> {
  return processedStripeWebhookEventIds.includes(eventId);
}

export async function recordProcessedStripeWebhookEvent(eventId: string): Promise<void> {
  if (!processedStripeWebhookEventIds.includes(eventId)) {
    processedStripeWebhookEventIds.push(eventId);
  }
}
