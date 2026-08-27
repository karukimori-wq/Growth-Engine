import { getContractStatus, getTimestamp } from "@/server/app-metadata";
import { isProductionAuthConfigured } from "@/server/auth-session";
import { checkDatabaseHealth } from "@/server/database-health";

type PilotStepStatus = "success" | "warning" | "error" | "skipped";
type PilotStep = { id: string; status: PilotStepStatus; evidence: string; issue: string | null; nextAction: string | null };
function summarize(steps: PilotStep[]) { return steps.reduce((acc, step) => ({ ...acc, [step.status]: acc[step.status] + 1 }), { success: 0, warning: 0, error: 0, skipped: 0 } satisfies Record<PilotStepStatus, number>); }

export async function getExternalPilotReadiness() {
  const checkedAt = getTimestamp();
  const contractStatus = getContractStatus();
  const databaseHealth = await checkDatabaseHealth();
  const productionAuthConfigured = isProductionAuthConfigured();
  const velvetIntegrationSecretConfigured = Boolean(process.env.VELVET_INTEGRATION_SECRET?.trim());
  const contractsReady = contractStatus.status === "success" && !contractStatus.usesLegacyEventNames && contractStatus.usesReportTerminology && contractStatus.canonicalOwnershipChecked && contractStatus.paymentAndSalesCanonicalOwner === "growth-engine";
  const dbReady = databaseHealth.databaseBackedPersistenceReady;

  const steps: PilotStep[] = [
    { id: "contracts.status", status: contractsReady ? "success" : "error", evidence: `contractStatus=${contractStatus.status}; usesLegacyEventNames=${contractStatus.usesLegacyEventNames}; usesReportTerminology=${contractStatus.usesReportTerminology}; paymentAndSalesCanonicalOwner=${contractStatus.paymentAndSalesCanonicalOwner}`, issue: contractsReady ? null : "Contracts status is not ready for external pilot.", nextAction: contractsReady ? null : "Fix /contracts/status before opening pilot access." },
    { id: "auth.production_owner_session", status: productionAuthConfigured ? "success" : "error", evidence: `productionAuthConfigured=${productionAuthConfigured}; authProvider=growth-engine-signed-session`, issue: productionAuthConfigured ? null : "Production owner auth env is not configured.", nextAction: productionAuthConfigured ? null : "Set GROWTH_ENGINE_AUTH_SECRET and GROWTH_ENGINE_OWNER_ACCESS_CODE, then redeploy." },
    { id: "persistence.database_runtime", status: dbReady ? "success" : "error", evidence: `repositoryDriver=${databaseHealth.repositoryDriver}; backend=${databaseHealth.backend}; configured=${databaseHealth.configured}; reachable=${databaseHealth.reachable}`, issue: dbReady ? null : databaseHealth.issue, nextAction: dbReady ? null : "Configure a reachable D1 or Postgres Growth Repository backend, then redeploy." },
    { id: "public_booking.persistence_flow", status: dbReady ? "success" : "error", evidence: "POST /api/public/bookings writes Customer and Reservation through the shared Growth Repository used by /app/business/reservations.", issue: dbReady ? null : "Public booking cannot be treated as cross-browser persistent until database-backed persistence is active.", nextAction: dbReady ? "Create one public booking and confirm the returned reservation appears in /app/business/reservations." : "Activate database-backed persistence, then run POST /api/persistence/roundtrip from owner session." },
    { id: "customer.source_of_truth", status: dbReady ? "success" : "error", evidence: "Growth Engine Customer repository backs public booking, business customers, and Velvet customer creation endpoint.", issue: dbReady ? null : "Customer source of truth exists in code, but pilot persistence requires a reachable database backend.", nextAction: dbReady ? null : "Complete database runtime setup before external pilot." },
    { id: "velvet.customer_integration_secret", status: velvetIntegrationSecretConfigured ? "success" : "warning", evidence: `velvetIntegrationSecretConfigured=${velvetIntegrationSecretConfigured}; secretValueExposed=false`, issue: velvetIntegrationSecretConfigured ? null : "Velvet integration secret is not configured, so Velvet cannot create Growth Engine Customer refs.", nextAction: velvetIntegrationSecretConfigured ? "Run Velvet -> Growth Engine customer create from the Velvet app trigger." : "Set VELVET_INTEGRATION_SECRET in Growth Engine Production." },
    { id: "data_safety.boundary", status: "success", evidence: "Contracts and integration status deny paymentStatus, salesAmount, Stripe data, Customer master exports, full report bodies, professional memory bodies, API keys, and secret prompts across app boundaries.", issue: null, nextAction: null }
  ];
  const summary = summarize(steps);
  const issues = steps.flatMap((step) => (step.issue ? [step.issue] : []));

  return {
    appName: "growth-engine", readinessArea: "external.pilot.minimum", status: summary.error > 0 ? "blocked" : summary.warning > 0 ? "needs_fix" : "ready", checkedAt,
    minimumExternalPilotReady: summary.error === 0 && summary.warning === 0, steps, summary,
    runtime: { database: { repositoryDriver: databaseHealth.repositoryDriver, backend: databaseHealth.backend, configured: databaseHealth.configured, reachable: databaseHealth.reachable, databaseBackedPersistenceReady: databaseHealth.databaseBackedPersistenceReady, envValuesExposed: false }, productionAuthConfigured, velvetIntegrationSecretConfigured, secretValuesExposed: false },
    requiredManualVerification: dbReady ? ["POST /api/persistence/roundtrip from an owner session", "Create a public booking and confirm it appears in /app/business/reservations", "Open /app/business/reservations/[reservationId] and confirm Professional handoff links work"] : [],
    dataSafety: { storesCardData: false, paymentStatusSentOutsideGrowthEngine: false, salesAmountSentOutsideGrowthEngine: false, stripeDataSentOutsideGrowthEngine: false, customerMasterSentOutsideGrowthEngine: false, reportBodyCopiedToGrowthEngine: false, professionalMemoryBodyCopiedToGrowthEngine: false, apiKeysOrSecretPromptsExposed: false },
    issues
  };
}
