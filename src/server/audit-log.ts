import type { Timestamp } from "@/domain/common";

export type AuditAction =
  | "ContentBrief.Requested"
  | "Customer.Updated"
  | "Lead.Converted"
  | "Reservation.Changed"
  | "Payment.Completed"
  | "Payment.Refunded"
  | "ExternalMessage.Sent"
  | "AiSuggestion.Executed"
  | "IntegrationSettings.Changed"
  | "Data.Deleted";

export type AuditLogEntry = {
  id: string;
  workspaceId: string;
  actorUserId: string;
  action: AuditAction;
  targetType: string;
  targetId?: string;
  occurredAt: Timestamp;
  metadata: Record<string, unknown>;
};

export async function recordAuditLog(input: Omit<AuditLogEntry, "id" | "occurredAt">): Promise<AuditLogEntry> {
  return {
    id: `audit_${Date.now()}`,
    occurredAt: new Date().toISOString(),
    ...input
  };
}
