import { NextResponse } from "next/server";
import { growthEngineSourceOfTruth } from "@/domain/business-boundary";
import { businessPlanContract } from "@/domain/plan-contract";
import { isBusinessCrossAppFlowEnabled } from "@/server/business-integration-access";
import {
  appName,
  appVersion,
  contractVersion,
  getCommitSha,
  getTimestamp
} from "@/server/app-metadata";

export async function GET() {
  const aiPlatformCoreConfigured = Boolean(process.env.AI_PLATFORM_CORE_URL);
  const commitSha = getCommitSha() ?? null;
  const businessFeatureFlagEnabled = isBusinessCrossAppFlowEnabled();

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
    businessFeatureFlagEnabled,
    businessIntegrationGate: {
      status: "compliant",
      requiredPlanId: businessPlanContract.requiredPlanId,
      requiredAvailabilityStatus: "available",
      featureFlagEnabled: businessFeatureFlagEnabled,
      failClosed: businessPlanContract.failClosed
    },
    entitlementReadiness: "compliant",
    usageReadiness: "not_applicable",
    aiPlatformCoreIntegration: {
      status: aiPlatformCoreConfigured ? "compliant" : "warning",
      endpointConfigured: aiPlatformCoreConfigured,
      activityTestEndpoint: "/api/integrations/ai-platform-core/activity-test"
    },
    feedbackHubEntry: {
      status: "not_applicable",
      reason: "Growth Engine is not a user-facing Free/Pro product surface in this release."
    },
    latestDeploy: {
      status: commitSha ? "compliant" : "warning",
      commitSha,
      verification: "cloudflare-production-workflow"
    },
    primaryErrorCategories: [
      "auth",
      "persistence",
      "ai_platform_core",
      "business_entitlement"
    ],
    growthEngineSourceOfTruth,
    issues: [],
    timestamp: getTimestamp()
  }, { status: 200 });
}
