import { NextResponse } from "next/server";
import { growthEngineSourceOfTruth } from "@/domain/business-boundary";
import { businessPlanContract } from "@/domain/plan-contract";
import { appName, appVersion, contractVersion, getTimestamp } from "@/server/app-metadata";

export async function GET() {
  return NextResponse.json({
    appId: appName,
    appName,
    appVersion,
    status: "ready",
    planContractVersion: contractVersion,
    planContractSource: "professional-platform-contracts/docs/contracts/plan-contract.md",
    releaseScope: "free-pro-support-boundary",
    plans: {
      free: "ready",
      pro: "ready",
      business: businessPlanContract.businessAvailabilityStatus
    },
    businessPurchasable: false,
    businessPublicEntryVisible: false,
    businessFeatureFlagKey: businessPlanContract.featureFlagKey,
    businessFeatureFlagDefault: businessPlanContract.featureFlagDefault,
    growthEngineSourceOfTruth,
    issues: [],
    timestamp: getTimestamp()
  }, { status: 200 });
}
