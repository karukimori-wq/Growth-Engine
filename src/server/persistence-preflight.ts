import { getTimestamp } from "@/server/app-metadata";
import { getGrowthRepositoryDriver, hasPostgresEnvironment } from "@/server/repositories";

export const postgresEnvCandidates = ["POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL"] as const;
export type PersistencePreflightStatus = "success" | "warning" | "error";

export type PersistencePreflight = {
  status: PersistencePreflightStatus;
  checkedAt: string;
  repositoryDriver: "mock" | "postgres" | "d1";
  postgresConfigured: boolean;
  databaseBackedPersistenceReady: boolean;
  env: {
    growthRepositoryDriverConfigured: boolean;
    growthRepositoryDriverExpectedValue: "postgres|d1";
    postgresConnectionConfigured: boolean;
    candidates: Array<{ name: string; configured: boolean }>;
    valuesExposed: false;
  };
  blockedUserFlows: string[];
  verification: {
    statusEndpoint: "GET /api/persistence/status";
    preflightEndpoint: "GET /api/persistence/preflight";
    roundtripEndpoint: "POST /api/persistence/roundtrip";
    roundtripRequiresOwnerSession: true;
    expectedRoundtripWhenReady: { status: "success"; roundtripReady: true; roundtripStatus: "success" };
  };
  sourceOfTruth: { customer: "growth-engine"; reservation: "growth-engine"; payment: "growth-engine"; sales: "growth-engine" };
  dataSafety: { envValuesExposed: false; paymentStatusSentOutsideGrowthEngine: false; salesAmountSentOutsideGrowthEngine: false; stripeDataSentOutsideGrowthEngine: false; customerMasterSentOutsideGrowthEngine: false };
  issues: string[];
  nextActions: string[];
};

export function getPersistencePreflight(): PersistencePreflight {
  const repositoryDriver = getGrowthRepositoryDriver();
  const postgresConfigured = hasPostgresEnvironment();
  const databaseBackedPersistenceReady = repositoryDriver === "d1" || (repositoryDriver === "postgres" && postgresConfigured);
  const driverConfigured = Boolean(process.env.GROWTH_REPOSITORY_DRIVER);
  const candidates = postgresEnvCandidates.map((name) => ({ name, configured: Boolean(process.env[name]) }));
  const issues = databaseBackedPersistenceReady ? [] : ["Database-backed Customer and Reservation persistence is not configured. Production must use D1 or a configured Postgres Growth Repository driver."];
  const nextActions = databaseBackedPersistenceReady
    ? ["Run GET /api/persistence/status and POST /api/persistence/roundtrip; runtime health must confirm the selected driver is reachable."]
    : ["Set GROWTH_REPOSITORY_DRIVER=d1 with a Cloudflare DB binding, or configure postgres with a supported Postgres URL.", "Redeploy Production, then run persistence status and roundtrip verification."];

  return {
    status: databaseBackedPersistenceReady ? "success" : "warning",
    checkedAt: getTimestamp(),
    repositoryDriver,
    postgresConfigured,
    databaseBackedPersistenceReady,
    env: { growthRepositoryDriverConfigured: driverConfigured, growthRepositoryDriverExpectedValue: "postgres|d1", postgresConnectionConfigured: postgresConfigured, candidates, valuesExposed: false },
    blockedUserFlows: databaseBackedPersistenceReady ? [] : ["public_booking.to_business_reservation_list", "reservation.detail.after_cross_browser_reload", "customer.detail.after_cross_browser_reload"],
    verification: {
      statusEndpoint: "GET /api/persistence/status",
      preflightEndpoint: "GET /api/persistence/preflight",
      roundtripEndpoint: "POST /api/persistence/roundtrip",
      roundtripRequiresOwnerSession: true,
      expectedRoundtripWhenReady: { status: "success", roundtripReady: true, roundtripStatus: "success" }
    },
    sourceOfTruth: { customer: "growth-engine", reservation: "growth-engine", payment: "growth-engine", sales: "growth-engine" },
    dataSafety: { envValuesExposed: false, paymentStatusSentOutsideGrowthEngine: false, salesAmountSentOutsideGrowthEngine: false, stripeDataSentOutsideGrowthEngine: false, customerMasterSentOutsideGrowthEngine: false },
    issues,
    nextActions
  };
}
