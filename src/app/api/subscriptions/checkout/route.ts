import { NextResponse } from "next/server";
import { z } from "zod";

import { isAuthorizedPlatformSubscriptionRequest, isPlatformSubscriptionProductCode } from "@/server/platform-subscriptions";
import { createPlatformSubscriptionCheckout } from "@/server/platform-subscription-stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  workspaceId: z.string().min(1).max(160),
  ownerUserId: z.string().min(1).max(200),
  productCode: z.enum(["numeria-studio", "velvet"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function POST(request: Request) {
  if (!isAuthorizedPlatformSubscriptionRequest(request)) {
    return NextResponse.json(
      { status: "error", errorCode: "SUBSCRIPTION_INTEGRATION_UNAUTHORIZED", secretValuesExposed: false },
      { status: 401 },
    );
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isPlatformSubscriptionProductCode(parsed.data?.productCode)) {
    return NextResponse.json(
      { status: "error", errorCode: "SUBSCRIPTION_CHECKOUT_INVALID", secretValuesExposed: false },
      { status: 400 },
    );
  }

  try {
    const checkout = await createPlatformSubscriptionCheckout(parsed.data);
    return NextResponse.json({
      status: "success",
      contract: "platform-saas-subscription.v1",
      sourceOfTruth: "growth-engine",
      checkout,
      businessPurchasable: false,
      secretValuesExposed: false,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      errorCode: "SUBSCRIPTION_CHECKOUT_UNAVAILABLE",
      message: error instanceof Error ? error.message : "Subscription checkout is unavailable.",
      secretValuesExposed: false,
    }, { status: 503 });
  }
}
