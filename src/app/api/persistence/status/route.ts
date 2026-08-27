import { NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";
import { checkD1Health } from "@/server/d1-db";
import { getPersistencePreflight } from "@/server/persistence-preflight";
import { checkPostgresHealth } from "@/server/postgres-health";
import { getGrowthRepositoryDriver } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  const preflight = getPersistencePreflight();
  const repositoryDriver = getGrowthRepositoryDriver();
  const d1Health = repositoryDriver === "d1" ? await checkD1Health() : null;
  const postgresHealth = repositoryDriver === "postgres" ? await checkPostgresHealth() : null;
  const databaseBackedPersistenceReady = d1Health?.databaseBackedPersistenceReady ?? postgresHealth?.databaseBackedPersistenceReady ?? false;
  const status = databaseBackedPersistenceReady ? "success" : (d1Health?.status ?? postgresHealth?.status ?? "warning");

  return NextResponse.json({
    appName,
    status,
    checkedAt: getTimestamp(),
    repositoryDriver,
    postgresConfigured: postgresHealth?.postgresConfigured ?? false,
    postgresReachable: postgresHealth?.postgresReachable ?? false,
    d1Configured: d1Health?.d1Configured ?? false,
    d1Reachable: d1Health?.d1Reachable ?? false,
    databaseBackedPersistenceReady,
    blockedUserFlows: databaseBackedPersistenceReady ? [] : preflight.blockedUserFlows,
    activePersistence: {
      customer: databaseBackedPersistenceReady ? repositoryDriver : "mock",
      reservation: databaseBackedPersistenceReady ? repositoryDriver : "mock",
      payment: "growth-engine",
      sales: "growth-engine"
    },
    sourceOfTruth: preflight.sourceOfTruth,
    requiredEnvCandidates: repositoryDriver === "postgres" ? preflight.env.candidates.map((candidate) => candidate.name) : [],
    preflight: {
      endpoint: preflight.verification.preflightEndpoint,
      envValuesExposed: false,
      growthRepositoryDriverConfigured: Boolean(process.env.GROWTH_REPOSITORY_DRIVER),
      postgresConnectionConfigured: preflight.env.postgresConnectionConfigured
    },
    postgresHealth: postgresHealth ? {
      status: postgresHealth.status,
      errorCode: postgresHealth.errorCode,
      issue: postgresHealth.issue,
      envValuesExposed: postgresHealth.envValuesExposed
    } : null,
    d1Health: d1Health ? {
      status: d1Health.status,
      errorCode: d1Health.errorCode,
      issue: d1Health.issue,
      durationMs: d1Health.durationMs,
      envValuesExposed: d1Health.envValuesExposed
    } : null,
    verification: preflight.verification,
    dataSafety: preflight.dataSafety,
    nextAction: databaseBackedPersistenceReady ? "Run POST /api/persistence/roundtrip from an owner session." : "Configure a reachable database-backed Growth Repository driver.",
    nextActions: databaseBackedPersistenceReady ? ["Run POST /api/persistence/roundtrip from an owner session."] : ["Configure GROWTH_REPOSITORY_DRIVER=d1 with the DB binding, or restore a reachable Postgres runtime."],
    issues: databaseBackedPersistenceReady ? [] : [d1Health?.issue ?? postgresHealth?.issue ?? preflight.issues[0]].filter(Boolean),
    timestamp: getTimestamp()
  }, { status: 200 });
}
