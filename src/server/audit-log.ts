import type { AuditLogEntry } from "@/domain/entities";
import { auditLogs } from "@/lib/mock-data";

export type { AuditAction, AuditLogEntry } from "@/domain/entities";

export async function recordAuditLog(input: Omit<AuditLogEntry, "id" | "occurredAt">): Promise<AuditLogEntry> {
  const entry = {
    id: `audit_${Date.now()}`,
    occurredAt: new Date().toISOString(),
    ...input
  };

  auditLogs.push(entry);
  return entry;
}

export async function listAuditLogs(workspaceId: string): Promise<AuditLogEntry[]> {
  return auditLogs.filter((entry) => entry.workspaceId === workspaceId);
}
