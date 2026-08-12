import type { Customer, Lead, Payment, ProcessedExternalEvent, Product, Reservation, Revenue } from "@/domain/entities";
import {
  customers,
  leads,
  payments,
  processedExternalEvents,
  products,
  revenues,
  todayReservations
} from "@/lib/mock-data";
import {
  createPostgresReservation,
  findPostgresReservation,
  listPostgresReservations,
  updatePostgresReservationPaymentStatus
} from "@/server/postgres-reservation-repository";

export type CreateLeadInput = Omit<Lead, "id" | "createdAt" | "updatedAt">;
export type CreateCustomerInput = Omit<Customer, "id" | "customerNumber" | "createdAt" | "updatedAt">;
export type CreateReservationInput = Omit<Reservation, "id" | "createdAt" | "updatedAt">;
export type CreatePaymentInput = Omit<Payment, "id" | "createdAt" | "updatedAt">;
export type CreateRevenueInput = Omit<Revenue, "id" | "createdAt">;
export type RecordProcessedExternalEventInput = {
  workspaceId: string;
  provider: ProcessedExternalEvent["provider"];
  externalEventId: string;
  eventType: string;
};

export type GrowthRepositoryDriver = "mock" | "postgres";

export type GrowthRepository = {
  listLeads(workspaceId: string): Promise<Lead[]>;
  findLead(workspaceId: string, leadId: string): Promise<Lead | undefined>;
  createLead(input: CreateLeadInput): Promise<Lead>;
  listCustomers(workspaceId: string): Promise<Customer[]>;
  findCustomer(workspaceId: string, customerId: string): Promise<Customer | undefined>;
  createCustomer(input: CreateCustomerInput): Promise<Customer>;
  convertLeadToCustomer(workspaceId: string, lead: Lead): Promise<Customer>;
  listProducts(workspaceId: string): Promise<Product[]>;
  findProduct(workspaceId: string, productId: string): Promise<Product | undefined>;
  listReservations(workspaceId: string): Promise<Reservation[]>;
  findReservation(workspaceId: string, reservationId: string): Promise<Reservation | undefined>;
  createReservation(input: CreateReservationInput): Promise<Reservation>;
  updateReservationPaymentStatus(
    workspaceId: string,
    reservationId: string | undefined,
    paymentStatus: Reservation["paymentStatus"]
  ): Promise<Reservation | undefined>;
  listPayments(workspaceId: string): Promise<Payment[]>;
  findPaymentByStripePaymentIntent(workspaceId: string, stripePaymentIntentId: string): Promise<Payment | undefined>;
  createPayment(input: CreatePaymentInput): Promise<Payment>;
  markPaymentPaid(payment: Payment, paidAt: string): Promise<Payment>;
  markPaymentRefunded(payment: Payment, refundStatus: "partial" | "full", refundedAt: string): Promise<Payment>;
  createRevenue(input: CreateRevenueInput): Promise<Revenue>;
  hasProcessedExternalEvent(
    workspaceId: string,
    provider: ProcessedExternalEvent["provider"],
    externalEventId: string
  ): Promise<boolean>;
  recordProcessedExternalEvent(input: RecordProcessedExternalEventInput): Promise<ProcessedExternalEvent>;
};

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

function createMockGrowthRepository(): GrowthRepository {
  return {
    async listLeads(workspaceId) {
      return filterByWorkspace(leads, workspaceId);
    },

    async findLead(workspaceId, leadId) {
      return leads.find((lead) => lead.workspaceId === workspaceId && lead.id === leadId);
    },

    async createLead(input) {
      const now = new Date().toISOString();
      const lead = {
        id: `lead_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        ...input
      };

      leads.push(lead);
      return lead;
    },

    async listCustomers(workspaceId) {
      return filterByWorkspace(customers, workspaceId);
    },

    async findCustomer(workspaceId, customerId) {
      return customers.find((customer) => customer.workspaceId === workspaceId && customer.id === customerId);
    },

    async createCustomer(input) {
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
    },

    async convertLeadToCustomer(workspaceId, lead) {
      const now = new Date().toISOString();
      const customer: Customer = {
        id: `cus_${Date.now()}`,
        customerNumber: `C-${Date.now().toString().slice(-6)}`,
        createdAt: now,
        updatedAt: now,
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
      };

      customers.push(customer);
      return customer;
    },

    async listProducts(workspaceId) {
      return filterByWorkspace(products, workspaceId);
    },

    async findProduct(workspaceId, productId) {
      return products.find((product) => product.workspaceId === workspaceId && product.id === productId);
    },

    async listReservations(workspaceId) {
      return filterByWorkspace(todayReservations, workspaceId);
    },

    async findReservation(workspaceId, reservationId) {
      return todayReservations.find(
        (reservation) => reservation.workspaceId === workspaceId && reservation.id === reservationId
      );
    },

    async createReservation(input) {
      const now = new Date().toISOString();
      const reservation = {
        id: `res_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        ...input
      };

      todayReservations.push(reservation);
      return reservation;
    },

    async updateReservationPaymentStatus(workspaceId, reservationId, paymentStatus) {
      if (!reservationId) {
        return undefined;
      }

      const reservation = todayReservations.find(
        (record) => record.workspaceId === workspaceId && record.id === reservationId
      );

      if (!reservation) {
        return undefined;
      }

      return replaceById(todayReservations, {
        ...reservation,
        paymentStatus,
        updatedAt: new Date().toISOString()
      });
    },

    async listPayments(workspaceId) {
      return filterByWorkspace(payments, workspaceId);
    },

    async findPaymentByStripePaymentIntent(workspaceId, stripePaymentIntentId) {
      return payments.find(
        (payment) => payment.workspaceId === workspaceId && payment.stripePaymentIntentId === stripePaymentIntentId
      );
    },

    async createPayment(input) {
      const now = new Date().toISOString();
      const payment = {
        id: `pay_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        ...input
      };

      payments.push(payment);
      return payment;
    },

    async markPaymentPaid(payment, paidAt) {
      return replaceById(payments, {
        ...payment,
        paymentStatus: "paid",
        paidAt,
        updatedAt: new Date().toISOString()
      });
    },

    async markPaymentRefunded(payment, refundStatus, refundedAt) {
      return replaceById(payments, {
        ...payment,
        paymentStatus: "refunded",
        refundStatus,
        refundedAt,
        updatedAt: new Date().toISOString()
      });
    },

    async createRevenue(input) {
      const revenue = {
        id: `rev_${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...input
      };

      revenues.push(revenue);
      return revenue;
    },

    async hasProcessedExternalEvent(workspaceId, provider, externalEventId) {
      return processedExternalEvents.some(
        (event) =>
          event.workspaceId === workspaceId &&
          event.provider === provider &&
          event.externalEventId === externalEventId
      );
    },

    async recordProcessedExternalEvent(input) {
      const existingEvent = processedExternalEvents.find(
        (event) =>
          event.workspaceId === input.workspaceId &&
          event.provider === input.provider &&
          event.externalEventId === input.externalEventId
      );

      if (existingEvent) {
        return existingEvent;
      }

      const now = new Date().toISOString();
      const processedEvent = {
        id: `pevt_${Date.now()}`,
        processedAt: now,
        createdAt: now,
        ...input
      };

      processedExternalEvents.push(processedEvent);
      return processedEvent;
    }
  };
}

function createPostgresGrowthRepository(): GrowthRepository {
  const mockRepository = createMockGrowthRepository();

  return {
    ...mockRepository,
    listReservations: listPostgresReservations,
    findReservation: findPostgresReservation,
    createReservation: createPostgresReservation,
    updateReservationPaymentStatus: updatePostgresReservationPaymentStatus
  };
}

export function createGrowthRepository(driver: GrowthRepositoryDriver = "mock"): GrowthRepository {
  if (driver === "postgres") {
    return createPostgresGrowthRepository();
  }

  return createMockGrowthRepository();
}

const growthRepository = createGrowthRepository(
  (process.env.GROWTH_REPOSITORY_DRIVER as GrowthRepositoryDriver | undefined) ?? "mock"
);

export function getGrowthRepository(): GrowthRepository {
  return growthRepository;
}

export const listLeads = growthRepository.listLeads;
export const findLead = growthRepository.findLead;
export const createLead = growthRepository.createLead;
export const listCustomers = growthRepository.listCustomers;
export const findCustomer = growthRepository.findCustomer;
export const createCustomer = growthRepository.createCustomer;
export const convertLeadToCustomer = growthRepository.convertLeadToCustomer;
export const listProducts = growthRepository.listProducts;
export const findProduct = growthRepository.findProduct;
export const createReservation = growthRepository.createReservation;
export const listReservations = growthRepository.listReservations;
export const findReservation = growthRepository.findReservation;
export const updateReservationPaymentStatus = growthRepository.updateReservationPaymentStatus;
export const listPayments = growthRepository.listPayments;
export const findPaymentByStripePaymentIntent = growthRepository.findPaymentByStripePaymentIntent;
export const createPayment = growthRepository.createPayment;
export const markPaymentPaid = growthRepository.markPaymentPaid;
export const markPaymentRefunded = growthRepository.markPaymentRefunded;
export const createRevenue = growthRepository.createRevenue;
export const hasProcessedExternalEvent = growthRepository.hasProcessedExternalEvent;
export const recordProcessedExternalEvent = growthRepository.recordProcessedExternalEvent;
