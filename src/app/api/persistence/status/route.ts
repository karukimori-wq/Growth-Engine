import { NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";
import { getPersistencePreflight } from "@/server/persistence-preflight";

export async function GET() {
  const preflight = getPersistencePreflight();

  return NextResponse.json(
    {
      appName,
      status: preflight.status,
      checkedAt: preflight.checkedAt,
      repositoryDriver: preflight.repositoryDriver,
      postgresConfigured: preflight.postgresConfigured,
      databaseBackedPersistenceReady: preflight.databaseBackedPersistenceReady,
      blockedUserFlows: preflight.blockedUserFlows,
      activePersistence: {
        customer: preflight.repositoryDriver === "postgres" ? "postgres" : "mock",
        reservation: preflight.repositoryDriver === "postgres" ? "postgres" : "mock",
        payment: "growth-engine",
        sales: "growth-engine"
      },
      sourceOfTruth: preflight.sourceOfTruth,
      requiredEnvCandidates: preflight.env.candidates.map((candidate) => candidate.name),
      preflight: {
        endpoint: preflight.verification.preflightEndpoint,
        envValuesExposed: preflight.env.valuesExposed,
        growthRepositoryDriverConfigured: preflight.env.growthRepositoryDriverConfigured,
        postgresConnectionConfigured: preflight.env.postgresConnectionConfigured
      },
      verification: preflight.verification,
      dataSafety: preflight.dataSafety,
      nextAction: preflight.nextActions[0] ?? null,
      nextActions: preflight.nextActions,
      issues: preflight.issues,
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}
