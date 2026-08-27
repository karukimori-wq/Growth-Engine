import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

export async function getD1Database(): Promise<D1DatabaseLike | null> {
  try {
    const context = await getCloudflareContext({ async: true });
    return (context.env as unknown as { DB?: D1DatabaseLike }).DB ?? null;
  } catch {
    return null;
  }
}

export async function checkD1Health() {
  const startedAt = Date.now();
  const db = await getD1Database();

  if (!db) {
    return {
      status: "error" as const,
      repositoryDriver: "d1" as const,
      d1Configured: false,
      d1Reachable: false,
      databaseBackedPersistenceReady: false,
      errorCode: "D1_BINDING_MISSING",
      issue: "Cloudflare D1 DB binding is not available.",
      durationMs: Date.now() - startedAt,
      envValuesExposed: false as const
    };
  }

  try {
    const row = await db.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    const reachable = row?.ok === 1;
    return {
      status: reachable ? "success" as const : "error" as const,
      repositoryDriver: "d1" as const,
      d1Configured: true,
      d1Reachable: reachable,
      databaseBackedPersistenceReady: reachable,
      errorCode: reachable ? null : "D1_HEALTH_CHECK_FAILED",
      issue: reachable ? null : "D1 health check did not return the expected result.",
      durationMs: Date.now() - startedAt,
      envValuesExposed: false as const
    };
  } catch (error) {
    return {
      status: "error" as const,
      repositoryDriver: "d1" as const,
      d1Configured: true,
      d1Reachable: false,
      databaseBackedPersistenceReady: false,
      errorCode: "D1_CONNECTION_FAILED",
      issue: error instanceof Error ? error.message : "D1 connection failed.",
      durationMs: Date.now() - startedAt,
      envValuesExposed: false as const
    };
  }
}

export function createD1Id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
