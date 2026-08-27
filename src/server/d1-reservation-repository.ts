import type { Reservation } from "@/domain/entities";
import { createD1Id, getD1Database } from "@/server/d1-db";
import type { CreateReservationInput } from "@/server/repositories";

type ReservationRow = {
  id: string;
  workspace_id: string;
  lead_id: string | null;
  customer_id: string | null;
  product_id: string;
  professional_studio_type: Reservation["professionalStudioType"];
  scheduled_start_at: string;
  scheduled_end_at: string;
  status: Reservation["status"];
  source_channel: string | null;
  campaign_id: string | null;
  content_id: string | null;
  payment_status: Reservation["paymentStatus"];
  session_id: string | null;
  created_at: string;
  updated_at: string;
};

function toReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    leadId: row.lead_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    productId: row.product_id,
    professionalStudioType: row.professional_studio_type,
    scheduledStartAt: row.scheduled_start_at,
    scheduledEndAt: row.scheduled_end_at,
    status: row.status,
    sourceChannel: row.source_channel ?? undefined,
    campaignId: row.campaign_id ?? undefined,
    contentId: row.content_id ?? undefined,
    paymentStatus: row.payment_status,
    sessionId: row.session_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function requireD1() {
  const db = await getD1Database();
  if (!db) throw new Error("D1_NOT_AVAILABLE: Growth Engine DB binding is missing.");
  return db;
}

export async function listD1Reservations(workspaceId: string): Promise<Reservation[]> {
  const db = await requireD1();
  const result = await db.prepare("SELECT * FROM growth_reservations WHERE workspace_id = ? ORDER BY scheduled_start_at ASC").bind(workspaceId).all<ReservationRow>();
  return result.results.map(toReservation);
}

export async function findD1Reservation(workspaceId: string, reservationId: string): Promise<Reservation | undefined> {
  const db = await requireD1();
  const row = await db.prepare("SELECT * FROM growth_reservations WHERE workspace_id = ? AND id = ? LIMIT 1").bind(workspaceId, reservationId).first<ReservationRow>();
  return row ? toReservation(row) : undefined;
}

export async function createD1Reservation(input: CreateReservationInput): Promise<Reservation> {
  const db = await requireD1();
  const now = new Date().toISOString();
  const reservation: Reservation = {
    id: createD1Id("res"),
    createdAt: now,
    updatedAt: now,
    ...input
  };

  await db.prepare(`INSERT INTO growth_reservations (
    id, workspace_id, lead_id, customer_id, product_id, professional_studio_type,
    scheduled_start_at, scheduled_end_at, status, source_channel, campaign_id, content_id,
    payment_status, session_id, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      reservation.id, reservation.workspaceId, reservation.leadId ?? null, reservation.customerId ?? null,
      reservation.productId, reservation.professionalStudioType, reservation.scheduledStartAt,
      reservation.scheduledEndAt, reservation.status, reservation.sourceChannel ?? null,
      reservation.campaignId ?? null, reservation.contentId ?? null, reservation.paymentStatus,
      reservation.sessionId ?? null, reservation.createdAt, reservation.updatedAt
    ).run();

  return reservation;
}

export async function updateD1ReservationPaymentStatus(
  workspaceId: string,
  reservationId: string | undefined,
  paymentStatus: Reservation["paymentStatus"]
): Promise<Reservation | undefined> {
  if (!reservationId) return undefined;
  const db = await requireD1();
  const updatedAt = new Date().toISOString();
  await db.prepare("UPDATE growth_reservations SET payment_status = ?, updated_at = ? WHERE workspace_id = ? AND id = ?")
    .bind(paymentStatus, updatedAt, workspaceId, reservationId).run();
  return findD1Reservation(workspaceId, reservationId);
}
