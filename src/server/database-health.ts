import { checkD1Health } from "@/server/d1-db";
import { checkPostgresHealth } from "@/server/postgres-health";
import { getGrowthRepositoryDriver } from "@/server/repositories";

export async function checkDatabaseHealth() {
  const repositoryDriver = getGrowthRepositoryDriver();

  if (repositoryDriver === "d1") {
    const health = await checkD1Health();
    return {
      status: health.status,
      repositoryDriver,
      databaseBackedPersistenceReady: health.databaseBackedPersistenceReady,
      configured: health.d1Configured,
      reachable: health.d1Reachable,
      backend: "d1" as const,
      issue: health.issue,
      errorCode: health.errorCode,
      envValuesExposed: false as const
    };
  }

  if (repositoryDriver === "postgres") {
    const health = await checkPostgresHealth();
    return {
      status: health.status,
      repositoryDriver,
      databaseBackedPersistenceReady: health.databaseBackedPersistenceReady,
      configured: health.postgresConfigured,
      reachable: health.postgresReachable,
      backend: "postgres" as const,
      issue: health.issue,
      errorCode: health.errorCode,
      envValuesExposed: false as const
    };
  }

  return {
    status: "warning" as const,
    repositoryDriver,
    databaseBackedPersistenceReady: false,
    configured: false,
    reachable: false,
    backend: "mock" as const,
    issue: "Growth Repository is using temporary mock persistence.",
    errorCode: "DATABASE_PERSISTENCE_NOT_CONFIGURED",
    envValuesExposed: false as const
  };
}
