import { NextRequest, NextResponse } from "next/server";

import {
  getPlatformSubscriptionEntitlement,
  isAuthorizedPlatformSubscriptionRequest,
  isPlatformSubscriptionProductCode,
} from "@/server/platform-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAuthorizedPlatformSubscriptionRequest(request)) {
    return NextResponse.json(
      { status: "error", errorCode: "SUBSCRIPTION_INTEGRATION_UNAUTHORIZED", secretValuesExposed: false },
      { status: 401 },
    );
  }

  const workspaceId = request.nextUrl.searchParams.get("workspaceId")?.trim() ?? "";
  const ownerUserId = request.nextUrl.searchParams.get("ownerUserId")?.trim() ?? "";
  const productCode = request.nextUrl.searchParams.get("productCode")?.trim() ?? "";

  if (!workspaceId || !ownerUserId || !isPlatformSubscriptionProductCode(productCode)) {
    return NextResponse.json(
      {
        status: "error",
        errorCode: "SUBSCRIPTION_SCOPE_INVALID",
        message: "workspaceId, ownerUserId, and a supported productCode are required.",
        secretValuesExposed: false,
      },
      { status: 400 },
    );
  }

  try {
    const entitlement = await getPlatformSubscriptionEntitlement({ workspaceId, ownerUserId, productCode });
    return NextResponse.json({
      status: "success",
      contract: "platform-saas-subscription.v1",
      sourceOfTruth: "growth-engine",
      ...entitlement,
      paymentDetailsReturned: false,
      stripeObjectReturned: false,
      secretValuesExposed: false,
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        errorCode: "SUBSCRIPTION_ENTITLEMENT_UNAVAILABLE",
        message: "Subscription entitlement is temporarily unavailable.",
        secretValuesExposed: false,
      },
      { status: 503 },
    );
  }
}
