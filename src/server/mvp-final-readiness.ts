import { getContractStatus, getTimestamp } from "@/server/app-metadata";
import { isProductionAuthConfigured } from "@/server/auth-session";
import { getGrowthRepositoryDriver, hasPostgresEnvironment } from "@/server/repositories";

type StepStatus = "success" | "warning" | "error" | "skipped";

type FinalReadinessStep = {
  id: string;
  title: string;
  status: StepStatus;
  evidence: string;
  issue: string | null;
  nextAction: string | null;
};

export type MvpFinalReadiness = {
  appName: "growth-engine";
  readinessArea: "mvp.final.growth-engine";
  status: "ready" | "needs_fix" | "blocked";
  checkedAt: string;
  steps: FinalReadinessStep[];
  summary: Record<StepStatus, number>;
  dataSafety: {
    storesCardData: false;
    paymentStatusSentOutsideGrowthEngine: false;
    salesAmountSentOutsideGrowthEngine: false;
    stripeDataSentOutsideGrowthEngine: false;
    customerMasterSentOutsideGrowthEngine: false;
    reportBodyCopiedToGrowthEngine: false;
    professionalMemoryBodyCopiedToGrowthEngine: false;
  };
  issues: string[];
};

function summarize(steps: FinalReadinessStep[]): Record<StepStatus, number> {
  return steps.reduce(
    (acc, step) => ({
      ...acc,
      [step.status]: acc[step.status] + 1
    }),
    { success: 0, warning: 0, error: 0, skipped: 0 } satisfies Record<StepStatus, number>
  );
}

export function getMvpFinalReadiness(): MvpFinalReadiness {
  const repositoryDriver = getGrowthRepositoryDriver();
  const postgresConfigured = hasPostgresEnvironment();
  const databaseBackedPersistenceReady = repositoryDriver === "postgres" && postgresConfigured;
  const productionAuthConfigured = isProductionAuthConfigured();
  const contractStatus = getContractStatus();
  const contractsReady =
    contractStatus.status === "success" &&
    !contractStatus.usesLegacyEventNames &&
    contractStatus.usesReportTerminology &&
    contractStatus.canonicalOwnershipChecked &&
    contractStatus.paymentAndSalesCanonicalOwner === "growth-engine";

  const steps: FinalReadinessStep[] = [
    {
      id: "postgres.production_env",
      title: "Postgres Production env設定",
      status: databaseBackedPersistenceReady ? "success" : "warning",
      evidence: `repositoryDriver=${repositoryDriver}; postgresConfigured=${postgresConfigured}`,
      issue: databaseBackedPersistenceReady
        ? null
        : "Production DB persistence is not active. Customer and Reservation still use the mock fallback.",
      nextAction: databaseBackedPersistenceReady
        ? null
        : "Set GROWTH_REPOSITORY_DRIVER=postgres and one supported Postgres connection env in Vercel Production, then redeploy."
    },
    {
      id: "db.roundtrip_verification",
      title: "DB保存 roundtrip確認",
      status: databaseBackedPersistenceReady ? "success" : "warning",
      evidence: "POST /api/persistence/roundtrip and /app/business/settings/persistence roundtrip UI are implemented and owner-protected.",
      issue: databaseBackedPersistenceReady
        ? null
        : "Roundtrip can be executed, but it will return warning/skipped until Postgres env is configured.",
      nextAction: databaseBackedPersistenceReady
        ? "Run the roundtrip from /app/business/settings/persistence with an owner session."
        : "Configure Postgres env first, then run the roundtrip UI."
    },
    {
      id: "public_booking.to_business_reservation",
      title: "公開予約から予約一覧反映",
      status: databaseBackedPersistenceReady ? "success" : "warning",
      evidence: "POST /api/public/bookings creates Customer and Reservation through the shared Growth Repository used by /app/business/reservations.",
      issue: databaseBackedPersistenceReady
        ? null
        : "Implementation uses the shared repository, but cross-browser persistence still depends on activating Postgres.",
      nextAction: databaseBackedPersistenceReady
        ? "Create one public booking and confirm it appears in /app/business/reservations and detail opens."
        : "Activate Postgres and repeat the public booking test."
    },
    {
      id: "customer_management.db_backed",
      title: "顧客管理の本番DB確認",
      status: databaseBackedPersistenceReady ? "success" : "warning",
      evidence: "/app/business/customers, detail, and edit screens use the Growth Repository customer methods.",
      issue: databaseBackedPersistenceReady
        ? null
        : "Customer screens are implemented, but persistent DB-backed behavior still depends on Postgres env.",
      nextAction: databaseBackedPersistenceReady
        ? "Create, list, detail, and edit a customer after owner sign-in."
        : "Activate Postgres before treating customer data as production-persistent."
    },
    {
      id: "sales_payment.minimum_screen",
      title: "売上・決済画面の最低限完成",
      status: "success",
      evidence: "/app/business/sales shows paid/unpaid reservations, customer sales, product sales, source sales, and states Growth Engine payment ownership.",
      issue: null,
      nextAction: "Continue Stripe webhook hardening after DB persistence is active."
    },
    {
      id: "contracts_and_launch_readiness",
      title: "MVP最終readiness",
      status: productionAuthConfigured && contractsReady ? "success" : "error",
      evidence: `productionAuthConfigured=${productionAuthConfigured}; contractsReady=${contractsReady}; contractStatus=${contractStatus.status}`,
      issue: productionAuthConfigured && contractsReady
        ? null
        : "Production auth or contracts readiness is not passing.",
      nextAction: productionAuthConfigured && contractsReady
        ? "Run /api/launch/growth-engine/readiness and /contracts/status after Postgres activation."
        : "Fix production auth or contract status before external pilot."
    }
  ];
  const summary = summarize(steps);
  const issues = steps.flatMap((step) => (step.issue ? [step.issue] : []));

  return {
    appName: "growth-engine",
    readinessArea: "mvp.final.growth-engine",
    status: summary.error > 0 ? "blocked" : summary.warning > 0 ? "needs_fix" : "ready",
    checkedAt: getTimestamp(),
    steps,
    summary,
    dataSafety: {
      storesCardData: false,
      paymentStatusSentOutsideGrowthEngine: false,
      salesAmountSentOutsideGrowthEngine: false,
      stripeDataSentOutsideGrowthEngine: false,
      customerMasterSentOutsideGrowthEngine: false,
      reportBodyCopiedToGrowthEngine: false,
      professionalMemoryBodyCopiedToGrowthEngine: false
    },
    issues
  };
}
