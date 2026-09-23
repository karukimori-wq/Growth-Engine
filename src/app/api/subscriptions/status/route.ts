import { NextResponse } from "next/server";

import { getPlatformSubscriptionReadiness } from "@/server/platform-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await getPlatformSubscriptionReadiness();
  return NextResponse.json({
    appName: "growth-engine",
    contract: "platform-saas-subscription.v1",
    owner: "growth-engine",
    products: ["numeria-studio", "velvet"],
    plans: ["free", "pro"],
    businessPurchasable: false,
    ...readiness,
  });
}
