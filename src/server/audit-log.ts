import type { AuditLogEntry } from "@/domain/entities";
import { auditLogs } from "@/lib/mock-data";

export type { AuditAction, AuditLogEntry } from "@/domain/entities";

export type AuditLogRepository = {
  record(input: Omit<AuditLogEntry, "id" | "occurredAt">): Promise<AuditLogEntry>;
  listByWorkspace(workspaceId: string): Promise<AuditLogEntry[]>;
};

export type AuditLogRepositoryDriver = "mock" | "postgres";

function createMockAuditLogRepository(): AuditLogRepository {
  return {
    async record(input) {
      const entry = {
        id: `audit_${Date.now()}`,
        occurredAt: new Date().toISOString(),
        ...input
      };

      auditLogs.push(entry);
      return entry;
    },

    async listByWorkspace(workspaceId) {
      return auditLogs.filter((entry) => entry.workspaceId === workspaceId);
    }
  };
}

function createPostgresAuditLogRepository(): AuditLogRepository {
  throw new Error("Postgres AuditLogRepository is not implemented yet.");
}

export function createAuditLogRepository(driver: AuditLogRepositoryDriver = "mock"): AuditLogRepository {
  if (driver === "postgres") {
    return createPostgresAuditLogRepository();
  }

  return createMockAuditLogRepository();
}

const auditLogRepository = createAuditLogRepository(
  (process.env.AUDIT_LOG_REPOSITORY_DRIVER as AuditLogRepositoryDriver | undefined) ?? "mock"
);

export function getAuditLogRepository(): AuditLogRepository {
  return auditLogRepository;
}

export async function recordAuditLog(input: Omit<AuditLogEntry, "id" | "occurredAt">): Promise<AuditLogEntry> {
  return auditLogRepository.record(input);
}

export async function listAuditLogs(workspaceId: string): Promise<AuditLogEntry[]> {
  return auditLogRepository.listByWorkspace(workspaceId);
}
