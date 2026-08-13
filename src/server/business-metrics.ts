import type { Customer, Payment, Reservation } from "@/domain/entities";
import { listCustomers, listLeads, listPayments, listReservations } from "@/server/repositories";

export type CustomerSalesRecord = {
  customer: Customer;
  paidAmount: number;
  paidCount: number;
  pendingAmount: number;
  latestReservation?: Reservation;
};

export type ReservationPaymentRecord = {
  reservation: Reservation;
  customer?: Customer;
  payment?: Payment;
};

export type BusinessMetrics = {
  customers: Customer[];
  leads: Awaited<ReturnType<typeof listLeads>>;
  reservations: Reservation[];
  payments: Payment[];
  paidSalesAmount: number;
  unpaidReservationCount: number;
  paidReservationCount: number;
  repeatCandidateCount: number;
  referralCandidateCount: number;
  customerSales: CustomerSalesRecord[];
  reservationPayments: ReservationPaymentRecord[];
};

export async function getBusinessMetrics(workspaceId: string): Promise<BusinessMetrics> {
  const [customers, leads, reservations, payments] = await Promise.all([
    listCustomers(workspaceId),
    listLeads(workspaceId),
    listReservations(workspaceId),
    listPayments(workspaceId)
  ]);
  const paidPayments = payments.filter((payment) => payment.paymentStatus === "paid");
  const paidSalesAmount = paidPayments.reduce((total, payment) => total + payment.amount, 0);
  const customerSales = customers.map((customer) => {
    const customerPayments = payments.filter((payment) => payment.customerId === customer.id);
    const customerReservations = reservations.filter((reservation) => reservation.customerId === customer.id);

    return {
      customer,
      paidAmount: customerPayments
        .filter((payment) => payment.paymentStatus === "paid")
        .reduce((total, payment) => total + payment.amount, 0),
      paidCount: customerPayments.filter((payment) => payment.paymentStatus === "paid").length,
      pendingAmount: customerPayments
        .filter((payment) => payment.paymentStatus === "pending" || payment.paymentStatus === "unpaid")
        .reduce((total, payment) => total + payment.amount, 0),
      latestReservation: customerReservations
        .slice()
        .sort((a, b) => new Date(b.scheduledStartAt).getTime() - new Date(a.scheduledStartAt).getTime())[0]
    };
  });
  const reservationPayments = reservations.map((reservation) => ({
    reservation,
    customer: customers.find((customer) => customer.id === reservation.customerId),
    payment: payments.find((payment) => payment.reservationId === reservation.id)
  }));

  return {
    customers,
    leads,
    reservations,
    payments,
    paidSalesAmount,
    unpaidReservationCount: reservations.filter((reservation) => reservation.paymentStatus === "unpaid").length,
    paidReservationCount: reservations.filter((reservation) => reservation.paymentStatus === "paid").length,
    repeatCandidateCount: customers.filter((customer) => customer.purchaseCount >= 1).length,
    referralCandidateCount: customers.filter((customer) => customer.purchaseCount >= 2 || customer.totalRevenue >= 20000).length,
    customerSales,
    reservationPayments
  };
}

export function formatCurrency(amount: number, currency = "JPY") {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}
