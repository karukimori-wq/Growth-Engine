import type { Reservation } from "@/domain/entities";

export const publicReservationsCookieName = "ge_public_reservations";

const maxStoredPublicReservations = 12;

function isReservationStatus(value: unknown): value is Reservation["status"] {
  return (
    value === "requested" ||
    value === "confirmed" ||
    value === "cancelled" ||
    value === "completed" ||
    value === "no_show"
  );
}

function isPaymentStatus(value: unknown): value is Reservation["paymentStatus"] {
  return value === "unpaid" || value === "paid" || value === "refunded";
}

function toPublicReservationRecord(value: unknown): Reservation | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Partial<Reservation>;

  if (
    typeof record.id !== "string" ||
    typeof record.workspaceId !== "string" ||
    typeof record.productId !== "string" ||
    typeof record.professionalStudioType !== "string" ||
    typeof record.scheduledStartAt !== "string" ||
    typeof record.scheduledEndAt !== "string" ||
    !isReservationStatus(record.status) ||
    !isPaymentStatus(record.paymentStatus) ||
    typeof record.createdAt !== "string" ||
    typeof record.updatedAt !== "string"
  ) {
    return undefined;
  }

  return {
    id: record.id,
    workspaceId: record.workspaceId,
    leadId: typeof record.leadId === "string" ? record.leadId : undefined,
    customerId: typeof record.customerId === "string" ? record.customerId : undefined,
    productId: record.productId,
    professionalStudioType: record.professionalStudioType as Reservation["professionalStudioType"],
    scheduledStartAt: record.scheduledStartAt,
    scheduledEndAt: record.scheduledEndAt,
    status: record.status,
    sourceChannel: typeof record.sourceChannel === "string" ? record.sourceChannel : undefined,
    campaignId: typeof record.campaignId === "string" ? record.campaignId : undefined,
    contentId: typeof record.contentId === "string" ? record.contentId : undefined,
    paymentStatus: record.paymentStatus,
    sessionId: typeof record.sessionId === "string" ? record.sessionId : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

export function getCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function parsePublicReservationsCookie(value: string | undefined): Reservation[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value));

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => toPublicReservationRecord(item))
      .filter((item): item is Reservation => Boolean(item));
  } catch {
    return [];
  }
}

export function serializePublicReservationsCookie(reservations: Reservation[]): string {
  return encodeURIComponent(JSON.stringify(reservations.slice(-maxStoredPublicReservations)));
}

export function mergeReservations(...reservationGroups: Reservation[][]): Reservation[] {
  const recordsById = new Map<string, Reservation>();

  for (const reservation of reservationGroups.flat()) {
    recordsById.set(reservation.id, reservation);
  }

  return Array.from(recordsById.values()).sort(
    (left, right) => new Date(left.scheduledStartAt).getTime() - new Date(right.scheduledStartAt).getTime()
  );
}
