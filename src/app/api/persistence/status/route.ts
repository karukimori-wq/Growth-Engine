import { NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";
import { getGrowthRepositoryDriver, hasPostgresEnvironment } from "@/server/repositories";

const postgresEnvCandidates = [
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL"
];

export async function GET() {
  const repositoryDriver = getGrowthRepositoryDriver();
  const postgresConfigured = hasPostgresEnvironment();
  const databaseBackedPersistenceReady = repositoryDriver === "postgres" && postgresConfigured;
  const blockedUserFlows = databaseBackedPersistenceReady
    ? []
    : [
        "public_booking.to_business_reservation_list",
        "reservation.detail.after_cross_browser_reload",
        "customer.detail.after_cross_browser_reload"
      ];
  const issues = databaseBackedPersistenceReady
    ? []
    : [
        "Database-backed Customer and Reservation persistence is not active. Configure a Postgres connection and use the postgres Growth Repository driver for production."
      ];

  return NextResponse.json(
    {
      appName,
      status: databaseBackedPersistenceReady ? "success" : "warning",
      checkedAt: getTimestamp(),
      repositoryDriver,
      postgresConfigured,
      databaseBackedPersistenceReady,
      blockedUserFlows,
      activePersistence: {
        customer: repositoryDriver === "postgres" ? "postgres" : "mock",
        reservation: repositoryDriver === "postgres" ? "postgres" : "mock",
        payment: "growth-engine",
        sales: "growth-engine"
      },
      sourceOfTruth: {
        customer: "growth-engine",
        reservation: "growth-engine",
        payment: "growth-engine",
        sales: "growth-engine"
      },
      requiredEnvCandidates: postgresEnvCandidates,
      verification: {
        roundtripEndpoint: "POST /api/persistence/roundtrip",
        roundtripRequiresOwnerSession: true,
        expectedRoundtripWhenReady: {
          status: "success",
          roundtripReady: true,
          roundtripStatus: "success"
        }
      },
      dataSafety: {
        envValuesExposed: false,
        paymentStatusSentOutsideGrowthEngine: false,
        salesAmountSentOutsideGrowthEngine: false,
        stripeDataSentOutsideGrowthEngine: false,
        customerMasterSentOutsideGrowthEngine: false
      },
      nextAction: databaseBackedPersistenceReady
        ? "Run POST /api/persistence/roundtrip from an owner session to verify DB write/read/list behavior."
        : "Configure GROWTH_REPOSITORY_DRIVER=postgres and one supported Postgres URL env in Vercel Production, then redeploy.",
      issues,
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}
