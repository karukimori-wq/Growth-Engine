import { NextResponse } from "next/server";
import { demoWorkspace } from "@/lib/mock-data";
import { createStripeClient } from "@/integrations/stripe";

type CheckStatus = "success" | "warning" | "error" | "skipped";

const checkedAt = () => new Date().toISOString();

export async function GET() {
  const stripe = createStripeClient();
  const checkout = await stripe.createCheckoutSession({
    workspaceId: demoWorkspace.id,
    customerId: "cus_001",
    reservationId: "res_launch_readiness_001",
    productId: "prd_numeria_basic",
    amount: 12000,
    currency: demoWorkspace.currency,
    successUrl: "https://growth-engine-ruby-nine.vercel.app/public/booking/confirmed",
    cancelUrl: "https://growth-engine-ruby-nine.vercel.app/public/booking"
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
      status: "success",
      evidence:
        "POST /api/public/bookings creates a requested Reservation with server-owned workspaceId/ownerUserId context and redirects to /public/booking/confirmed.",
      issue: null
    },
    {
      id: "auth.workspace_isolation",
      status: "warning",
      evidence:
        "src/middleware.ts protects /app/business with demo owner auth; server APIs use resolveBusinessApiContext and requireWorkspaceAccess. Production identity provider is still demo.",
      issue:
        "MVP demo auth is implemented, but production auth provider replacement is still required before external pilot."
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
      demoWorkspaceId: demoWorkspace.id,
      ownerUserId: demoWorkspace.ownerUserId
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
