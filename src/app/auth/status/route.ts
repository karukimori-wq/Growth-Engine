import { NextResponse } from "next/server";
import { appName, appVersion, getTimestamp } from "@/server/app-metadata";
import { authSessionCookieName, isProductionAuthConfigured } from "@/server/auth-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isProductionAuthConfigured();

  return NextResponse.json({
    appId: appName,
    appName,
    appVersion,
    status: configured ? "ready" : "warning",
    authMode: "signed-owner-session",
    authConfigured: configured,
    activeUserRequired: true,
    businessPlanRequiredForOwnerBusinessApis: true,
    sessionCookieName: authSessionCookieName,
    secretValuesExposed: false,
    issues: configured ? [] : ["Production auth configuration is incomplete."],
    timestamp: getTimestamp()
  }, { status: 200 });
}
