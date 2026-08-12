import { sql } from "@vercel/postgres";
import type { Reservation } from "@/domain/entities";
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

let schemaReady: Promise<void> | undefined;

function createReservationId() {
  return `res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toIso(value: string | Date) {
  return new Date(value).toISOString();
}

function toReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    leadId: row.lead_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    productId: row.product_id,
    professionalStudioType: row.professional_studio_type,
    scheduledStartAt: toIso(row.scheduled_start_at),
    scheduledEndAt: toIso(row.scheduled_end_at),
    status: row.status,
    sourceChannel: row.source_channel ?? undefined,
    campaignId: row.campaign_id ?? undefined,
    contentId: row.content_id ?? undefined,
    paymentStatus: row.payment_status,
    sessionId: row.session_id ?? undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

async function ensureReservationSchema() {
  schemaReady ??= sql`
    CREATE TABLE IF NOT EXISTS growth_reservations (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      lead_id TEXT,
      customer_id TEXT,
      product_id TEXT NOT NULL,
      professional_studio_type TEXT NOT NULL,
      scheduled_start_at TIMESTAMPTZ NOT NULL,
      scheduled_end_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL,
      source_channel TEXT,
      campaign_id TEXT,
      content_id TEXT,
      payment_status TEXT NOT NULL,
      session_id TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `.then(async () => {
    await sql`CREATE INDEX IF NOT EXISTS growth_reservations_workspace_idx ON growth_reservations (workspace_id, scheduled_start_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS growth_reservations_customer_idx ON growth_reservations (workspace_id, customer_id)`;
  });

  return schemaReady;
}

export async function listPostgresReservations(workspaceId: string): Promise<Reservation[]> {
  await ensureReservationSchema();

  const result = await sql<ReservationRow>`
    SELECT *
    FROM growth_reservations
    WHERE workspace_id = ${workspaceId}
    ORDER BY scheduled_start_at ASC
  `;

  return result.rows.map(toReservation);
}

export async function findPostgresReservation(
  workspaceId: string,
  reservationId: string
): Promise<Reservation | undefined> {
  await ensureReservationSchema();

  const result = await sql<ReservationRow>`
    SELECT *
    FROM growth_reservations
    WHERE workspace_id = ${workspaceId}
      AND id = ${reservationId}
    LIMIT 1
  `;

  return result.rows[0] ? toReservation(result.rows[0]) : undefined;
}

export async function createPostgresReservation(input: CreateReservationInput): Promise<Reservation> {
  await ensureReservationSchema();

  const now = new Date().toISOString();
  const reservation: Reservation = {
    id: createReservationId(),
    createdAt: now,
    updatedAt: now,
    ...input
  };

  const result = await sql<ReservationRow>`
    INSERT INTO growth_reservations (
      id,
      workspace_id,
      lead_id,
      customer_id,
      product_id,
      professional_studio_type,
      scheduled_start_at,
      scheduled_end_at,
      status,
      source_channel,
      campaign_id,
      content_id,
      payment_status,
      session_id,
      created_at,
      updated_at
    ) VALUES (
      ${reservation.id},
      ${reservation.workspaceId},
      ${reservation.leadId ?? null},
      ${reservation.customerId ?? null},
      ${reservation.productId},
      ${reservation.professionalStudioType},
      ${reservation.scheduledStartAt},
      ${reservation.scheduledEndAt},
      ${reservation.status},
      ${reservation.sourceChannel ?? null},
      ${reservation.campaignId ?? null},
      ${reservation.contentId ?? null},
      ${reservation.paymentStatus},
      ${reservation.sessionId ?? null},
      ${reservation.createdAt},
      ${reservation.updatedAt}
    )
    RETURNING *
  `;

  return toReservation(result.rows[0]);
}

export async function updatePostgresReservationPaymentStatus(
  workspaceId: string,
  reservationId: string | undefined,
  paymentStatus: Reservation["paymentStatus"]
): Promise<Reservation | undefined> {
  if (!reservationId) {
    return undefined;
  }

  await ensureReservationSchema();

  const result = await sql<ReservationRow>`
    UPDATE growth_reservations
    SET payment_status = ${paymentStatus},
        updated_at = ${new Date().toISOString()}
    WHERE workspace_id = ${workspaceId}
      AND id = ${reservationId}
    RETURNING *
  `;

  return result.rows[0] ? toReservation(result.rows[0]) : undefined;
}
