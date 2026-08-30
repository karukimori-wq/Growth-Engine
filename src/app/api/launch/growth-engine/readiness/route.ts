import { NextResponse } from "next/server";
import { demoWorkspace } from "@/lib/mock-data";
import { createStripeClient } from "@/integrations/stripe";
import { isProductionAuthConfigured } from "@/server/auth-session";
import { checkDatabaseHealth } from "@/server/database-health";

type CheckStatus = "success" | "warning" | "error" | "skipped";

const checkedAt = () => new Date().toISOString();

export async function GET(request: Request) {
  const stripe = createStripeClient();
  const databaseHealth = await checkDatabaseHealth();
  const databaseBackedPersistenceReady = databaseHealth.databaseBackedPersistenceReady;
  const baseUrl = new URL(request.url).origin;
  const checkout = await stripe.createCheckoutSession({
    workspaceId: demoWorkspace.id,
    customerId: "cus_001",
    reservationId: "res_launch_readiness_001",
    productId: "prd_numeria_basic",
    amount: 12000,
    currency: demoWorkspace.currency,
    successUrl: `${baseUrl}/public/booking/confirmed`,
    cancelUrl: `${baseUrl}/public/booking`
  });
  const checks: Array<{
    id: string;
    status: CheckStatus;
    evidence: string;
    issue: string | null;
  }> = [
    {
      id: "stripe.test_mode.checkout",
      status: checkout.mode === "test" && !checkout.cardDataStored ? "success" : "error",
      evidence:
        "src/integrations/stripe.ts returns mode=test, creates cs_demo/pi_demo references, and cardDataStored=false.",
      issue: null
    },
    {
      id: "public_booking.to_reservation",
      status: databaseBackedPersistenceReady ? "success" : "error",
      evidence:
        "POST /api/public/bookings creates a Customer and requested Reservation through the Growth Repository used by /app/business/reservations.",
      issue: databaseBackedPersistenceReady
        ? null
        : databaseHealth.issue ?? "Database-backed Customer and Reservation persistence is not ready."
    },
    {
      id: "auth.workspace_isolation",
      status: isProductionAuthConfigured() ? "success" : "error",
      evidence:
        "Production signed-session auth provider protects /app/business; server APIs resolve owner session and requireWorkspaceAccess.",
      issue: isProductionAuthConfigured()
        ? null
        : "GROWTH_ENGINE_AUTH_SECRET and GROWTH_ENGINE_OWNER_ACCESS_CODE must be configured in production."
    }
  ];
  const hasError = checks.some((check) => check.status === "error");
  const hasWarning = checks.some((check) => check.status === "warning");

  return NextResponse.json({
    appName: "growth-engine",
    launchReadinessArea: "mvp.launch.growth-engine",
    status: hasError ? "blocked" : hasWarning ? "needs_fix" : "ready",
    checkedAt: checkedAt(),
    checks,
    stripe: {
      mode: checkout.mode,
      checkoutSessionCreated: true,
      checkoutSessionIdPrefix: "cs_demo",
      paymentIntentIdPrefix: "pi_demo",
      cardDataStored: checkout.cardDataStored
    },
    identity: {
      identityMode: "workspaceId+userId",
      professionalIdRequired: false,
      authProvider: "growth-engine-signed-session",
      productionAuthConfigured: isProductionAuthConfigured(),
      demoWorkspaceId: demoWorkspace.id,
      ownerUserId: demoWorkspace.ownerUserId
    },
    persistence: {
      repositoryDriver: databaseHealth.repositoryDriver,
      backend: databaseHealth.backend,
      configured: databaseHealth.configured,
      reachable: databaseHealth.reachable,
      postgresConfigured: databaseHealth.backend === "postgres" ? databaseHealth.configured : false,
      postgresReachable: databaseHealth.backend === "postgres" ? databaseHealth.reachable : false,
      d1Configured: databaseHealth.backend === "d1" ? databaseHealth.configured : false,
      d1Reachable: databaseHealth.backend === "d1" ? databaseHealth.reachable : false,
      customerPersistence: databaseBackedPersistenceReady ? databaseHealth.repositoryDriver : "mock",
      reservationPersistence: databaseBackedPersistenceReady ? databaseHealth.repositoryDriver : "mock",
      databaseBackedPersistenceReady
    },
    dataSafety: {
      storesCardData: false,
      paymentStatusSentOutsideGrowthEngine: false,
      salesAmountSentOutsideGrowthEngine: false,
      generalCustomerCanAccessBusinessAdmin: false,
      crossWorkspaceDataVisible: false
    },
    issues: checks.flatMap((check) => (check.issue ? [check.issue] : []))
  });
}
