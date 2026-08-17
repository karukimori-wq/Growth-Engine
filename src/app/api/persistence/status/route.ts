import { NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";
import { getPersistencePreflight } from "@/server/persistence-preflight";
import { checkPostgresHealth } from "@/server/postgres-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const [preflight, postgresHealth] = await Promise.all([
    Promise.resolve(getPersistencePreflight()),
    checkPostgresHealth()
  ]);
  const databaseBackedPersistenceReady = postgresHealth.databaseBackedPersistenceReady;
  const status = databaseBackedPersistenceReady ? "success" : postgresHealth.status;

  return NextResponse.json(
    {
      appName,
      status,
      checkedAt: getTimestamp(),
      repositoryDriver: postgresHealth.repositoryDriver,
      postgresConfigured: postgresHealth.postgresConfigured,
      postgresReachable: postgresHealth.postgresReachable,
      databaseBackedPersistenceReady,
      blockedUserFlows: databaseBackedPersistenceReady ? [] : preflight.blockedUserFlows,
      activePersistence: {
        customer: databaseBackedPersistenceReady ? "postgres" : "mock",
        reservation: databaseBackedPersistenceReady ? "postgres" : "mock",
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
      postgresHealth: {
        status: postgresHealth.status,
        errorCode: postgresHealth.errorCode,
        issue: postgresHealth.issue,
        envValuesExposed: postgresHealth.envValuesExposed
      },
      verification: preflight.verification,
      dataSafety: preflight.dataSafety,
      nextAction: databaseBackedPersistenceReady
        ? "Run POST /api/persistence/roundtrip from an owner session."
        : preflight.nextActions[0] ?? null,
      nextActions: databaseBackedPersistenceReady
        ? ["Run POST /api/persistence/roundtrip from an owner session."]
        : preflight.nextActions,
      issues: databaseBackedPersistenceReady ? [] : [postgresHealth.issue ?? preflight.issues[0]].filter(Boolean),
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}
