import { getTimestamp } from "@/server/app-metadata";
import { queryPostgres } from "@/server/postgres-db";
import { getGrowthRepositoryDriver, hasPostgresEnvironment } from "@/server/repositories";

export type PostgresHealthStatus = "success" | "warning" | "error";

export type PostgresHealth = {
  status: PostgresHealthStatus;
  checkedAt: string;
  repositoryDriver: "mock" | "postgres";
  postgresConfigured: boolean;
  postgresReachable: boolean;
  databaseBackedPersistenceReady: boolean;
  errorCode: null | "PERSISTENCE_NOT_CONFIGURED" | "POSTGRES_DRIVER_NOT_ACTIVE" | "POSTGRES_UNREACHABLE";
  envValuesExposed: false;
  issue: string | null;
};

export async function checkPostgresHealth(): Promise<PostgresHealth> {
  const repositoryDriver = getGrowthRepositoryDriver();
  const postgresConfigured = hasPostgresEnvironment();
  const checkedAt = getTimestamp();

  if (!postgresConfigured) {
    return {
      status: "warning",
      checkedAt,
      repositoryDriver,
      postgresConfigured,
      postgresReachable: false,
      databaseBackedPersistenceReady: false,
      errorCode: "PERSISTENCE_NOT_CONFIGURED",
      envValuesExposed: false,
      issue: "Production Postgres connection env is not configured."
    };
  }

  if (repositoryDriver !== "postgres") {
    return {
      status: "warning",
      checkedAt,
      repositoryDriver,
      postgresConfigured,
      postgresReachable: false,
      databaseBackedPersistenceReady: false,
      errorCode: "POSTGRES_DRIVER_NOT_ACTIVE",
      envValuesExposed: false,
      issue: "Postgres env exists, but Growth Repository driver is not postgres."
    };
  }

  try {
    await queryPostgres("SELECT 1 AS ok");

    return {
      status: "success",
      checkedAt,
      repositoryDriver,
      postgresConfigured,
      postgresReachable: true,
      databaseBackedPersistenceReady: true,
      errorCode: null,
      envValuesExposed: false,
      issue: null
    };
  } catch {
    return {
      status: "error",
      checkedAt,
      repositoryDriver,
      postgresConfigured,
      postgresReachable: false,
      databaseBackedPersistenceReady: false,
      errorCode: "POSTGRES_UNREACHABLE",
      envValuesExposed: false,
      issue: "Postgres env is configured, but Growth Engine cannot reach the database at runtime."
    };
  }
}
