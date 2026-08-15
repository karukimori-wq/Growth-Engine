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
      dataSafety: {
        envValuesExposed: false,
        paymentStatusSentOutsideGrowthEngine: false,
        salesAmountSentOutsideGrowthEngine: false,
        stripeDataSentOutsideGrowthEngine: false,
        customerMasterSentOutsideGrowthEngine: false
      },
      issues,
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}
