import type { Payment, Product, Reservation } from "@/domain/entities";
import type { BusinessMetrics } from "@/server/business-metrics";

export type BusinessBreakdownRow = {
  key: string;
  label: string;
  count: number;
  amount: number;
};

function addToMap(map: Map<string, BusinessBreakdownRow>, key: string, label: string, amount: number) {
  const current = map.get(key) ?? { key, label, count: 0, amount: 0 };
  current.count += 1;
  current.amount += amount;
  map.set(key, current);
}

function sortRows(rows: BusinessBreakdownRow[]) {
  return rows.sort((a, b) => b.amount - a.amount || b.count - a.count || a.label.localeCompare(b.label));
}

export function buildRevenueBySource(metrics: BusinessMetrics): BusinessBreakdownRow[] {
  const map = new Map<string, BusinessBreakdownRow>();

  for (const payment of metrics.payments.filter((record) => record.paymentStatus === "paid")) {
    const reservation = metrics.reservations.find((record) => record.id === payment.reservationId);
    const source = reservation?.sourceChannel ?? "unknown";
    addToMap(map, source, source === "unknown" ? "未設定" : source, payment.amount);
  }

  return sortRows(Array.from(map.values()));
}

export function buildRevenueByProduct(metrics: BusinessMetrics): BusinessBreakdownRow[] {
  const map = new Map<string, BusinessBreakdownRow>();

  for (const payment of metrics.payments.filter((record) => record.paymentStatus === "paid")) {
    const product = findProduct(metrics.reservationPayments, payment);
    addToMap(map, payment.productId ?? "unknown", product?.name ?? payment.productId ?? "未設定", payment.amount);
  }

  return sortRows(Array.from(map.values()));
}

export function buildReservationsByStatus(metrics: BusinessMetrics): BusinessBreakdownRow[] {
  const map = new Map<string, BusinessBreakdownRow>();

  for (const reservation of metrics.reservations) {
    addToMap(map, reservation.status, reservationStatusLabel(reservation.status), 0);
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function buildPaymentStatusRows(metrics: BusinessMetrics): BusinessBreakdownRow[] {
  const map = new Map<string, BusinessBreakdownRow>();

  for (const payment of metrics.payments) {
    addToMap(map, payment.paymentStatus, paymentStatusLabel(payment.paymentStatus), payment.amount);
  }

  for (const reservation of metrics.reservations.filter((record) => record.paymentStatus === "unpaid")) {
    addToMap(map, "reservation_unpaid", "予約未払い", 0);
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count || b.amount - a.amount);
}

function findProduct(
  reservationPayments: BusinessMetrics["reservationPayments"],
  payment: Payment
): Product | undefined {
  return reservationPayments.find(({ reservation }) => reservation.id === payment.reservationId)?.product;
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
