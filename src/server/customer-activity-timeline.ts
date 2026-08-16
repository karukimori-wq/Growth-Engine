import type { Customer, Payment, Reservation } from "@/domain/entities";

export type CustomerTimelineEntry = {
  id: string;
  occurredAt: string;
  title: string;
  summary: string;
  statusLabel?: string;
  href?: string;
  source: "growth-engine";
};

function formatDateTime(timestamp: string) {
  return new Date(timestamp).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function paymentStatusLabel(status: Payment["paymentStatus"]) {
  const labels: Record<Payment["paymentStatus"], string> = {
    unpaid: "未払い",
    pending: "確認中",
    paid: "支払い済み",
    cancelled: "キャンセル",
    failed: "失敗",
    refunded: "返金済み"
  };

  return labels[status];
}

function reservationStatusLabel(status: Reservation["status"]) {
  const labels: Record<Reservation["status"], string> = {
    requested: "受付済み",
    confirmed: "確定",
    cancelled: "キャンセル",
    completed: "完了",
    no_show: "無断キャンセル"
  };

  return labels[status];
}

export function buildCustomerActivityTimeline(input: {
  customer: Customer;
  reservations: Reservation[];
  payments: Payment[];
}): CustomerTimelineEntry[] {
  const customerReservationIds = new Set(input.reservations.map((reservation) => reservation.id));

  const customerCreated: CustomerTimelineEntry = {
    id: `timeline_customer_${input.customer.id}`,
    occurredAt: input.customer.createdAt,
    title: "顧客を作成",
    summary: `Growth EngineのCustomer正本として登録しました。customerId: ${input.customer.id}`,
    statusLabel: input.customer.customerStatus,
    href: `/app/business/customers/${input.customer.id}`,
    source: "growth-engine"
  };

  const reservationEntries = input.reservations.map((reservation) => ({
    id: `timeline_reservation_${reservation.id}`,
    occurredAt: reservation.createdAt,
    title: "予約を作成",
    summary: `${formatDateTime(reservation.scheduledStartAt)} の予約です。reservationId: ${reservation.id}`,
    statusLabel: reservationStatusLabel(reservation.status),
    href: `/app/business/reservations/${reservation.id}`,
    source: "growth-engine" as const
  }));

  const paymentEntries = input.payments
    .filter((payment) => payment.reservationId ? customerReservationIds.has(payment.reservationId) : true)
    .map((payment) => ({
      id: `timeline_payment_${payment.id}`,
      occurredAt: payment.paidAt ?? payment.updatedAt ?? payment.createdAt,
      title: "支払い状態を更新",
      summary: `Growth Engine内で決済状態を記録しました。paymentId: ${payment.id}`,
      statusLabel: paymentStatusLabel(payment.paymentStatus),
      href: payment.reservationId ? `/app/business/reservations/${payment.reservationId}` : undefined,
      source: "growth-engine" as const
    }));

  return [customerCreated, ...reservationEntries, ...paymentEntries].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
}
