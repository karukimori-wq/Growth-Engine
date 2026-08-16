import { getTimestamp } from "@/server/app-metadata";
import { getGrowthRepositoryDriver, hasPostgresEnvironment } from "@/server/repositories";

export const postgresEnvCandidates = [
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL"
] as const;

export type PersistencePreflightStatus = "success" | "warning" | "error";

export type PersistencePreflight = {
  status: PersistencePreflightStatus;
  checkedAt: string;
  repositoryDriver: "mock" | "postgres";
  postgresConfigured: boolean;
  databaseBackedPersistenceReady: boolean;
  env: {
    growthRepositoryDriverConfigured: boolean;
    growthRepositoryDriverExpectedValue: "postgres";
    postgresConnectionConfigured: boolean;
    candidates: Array<{
      name: string;
      configured: boolean;
    }>;
    valuesExposed: false;
  };
  blockedUserFlows: string[];
  verification: {
    statusEndpoint: "GET /api/persistence/status";
    preflightEndpoint: "GET /api/persistence/preflight";
    roundtripEndpoint: "POST /api/persistence/roundtrip";
    roundtripRequiresOwnerSession: true;
    expectedRoundtripWhenReady: {
      status: "success";
      roundtripReady: true;
      roundtripStatus: "success";
    };
  };
  sourceOfTruth: {
    customer: "growth-engine";
    reservation: "growth-engine";
    payment: "growth-engine";
    sales: "growth-engine";
  };
  dataSafety: {
    envValuesExposed: false;
    paymentStatusSentOutsideGrowthEngine: false;
    salesAmountSentOutsideGrowthEngine: false;
    stripeDataSentOutsideGrowthEngine: false;
    customerMasterSentOutsideGrowthEngine: false;
  };
  issues: string[];
  nextActions: string[];
};

export function getPersistencePreflight(): PersistencePreflight {
  const repositoryDriver = getGrowthRepositoryDriver();
  const postgresConfigured = hasPostgresEnvironment();
  const databaseBackedPersistenceReady = repositoryDriver === "postgres" && postgresConfigured;
  const driverConfigured = Boolean(process.env.GROWTH_REPOSITORY_DRIVER);
  const candidates = postgresEnvCandidates.map((name) => ({
    name,
    configured: Boolean(process.env[name])
  }));

  const issues = databaseBackedPersistenceReady
    ? []
    : [
        "Database-backed Customer and Reservation persistence is not active. Production must use the postgres Growth Repository driver and a configured Postgres connection."
      ];

  const nextActions = databaseBackedPersistenceReady
    ? ["Run POST /api/persistence/roundtrip from an owner session and confirm write/read/list all pass."]
    : [
        "Set GROWTH_REPOSITORY_DRIVER=postgres in Vercel Production.",
        "Set one supported Postgres connection env in Vercel Production.",
        "Redeploy Production, then run GET /api/persistence/preflight and POST /api/persistence/roundtrip."
      ];

  return {
    status: databaseBackedPersistenceReady ? "success" : "warning",
    checkedAt: getTimestamp(),
    repositoryDriver,
    postgresConfigured,
    databaseBackedPersistenceReady,
    env: {
      growthRepositoryDriverConfigured: driverConfigured,
      growthRepositoryDriverExpectedValue: "postgres",
      postgresConnectionConfigured: postgresConfigured,
      candidates,
      valuesExposed: false
    },
    blockedUserFlows: databaseBackedPersistenceReady
      ? []
      : [
          "public_booking.to_business_reservation_list",
          "reservation.detail.after_cross_browser_reload",
          "customer.detail.after_cross_browser_reload"
        ],
    verification: {
      statusEndpoint: "GET /api/persistence/status",
      preflightEndpoint: "GET /api/persistence/preflight",
      roundtripEndpoint: "POST /api/persistence/roundtrip",
      roundtripRequiresOwnerSession: true,
      expectedRoundtripWhenReady: {
        status: "success",
        roundtripReady: true,
        roundtripStatus: "success"
      }
    },
    sourceOfTruth: {
      customer: "growth-engine",
      reservation: "growth-engine",
      payment: "growth-engine",
      sales: "growth-engine"
    },
    dataSafety: {
      envValuesExposed: false,
      paymentStatusSentOutsideGrowthEngine: false,
      salesAmountSentOutsideGrowthEngine: false,
      stripeDataSentOutsideGrowthEngine: false,
      customerMasterSentOutsideGrowthEngine: false
    },
    issues,
    nextActions
  };
}
