import { NextResponse } from "next/server";

import { applyPlatformSubscriptionStripeWebhook } from "@/server/platform-subscription-stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const result = await applyPlatformSubscriptionStripeWebhook(rawBody, request.headers.get("stripe-signature"));

  if (!result.ok) {
    return NextResponse.json({
      status: "error",
      errorCode: result.errorCode,
      secretValuesExposed: false,
    }, { status: result.status });
  }

  return NextResponse.json({
    status: "success",
    received: true,
    ...result,
    paymentDetailsReturned: false,
    stripeObjectReturned: false,
    secretValuesExposed: false,
  });
}
