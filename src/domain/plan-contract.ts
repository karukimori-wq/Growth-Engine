export const supportedPlanIds = ["free", "pro", "business"] as const;

export type SharedPlanId = (typeof supportedPlanIds)[number];
export type BusinessOfferingStatus = "not_offered" | "available";

export const businessPlanContract = {
  planIdField: "planId",
  businessOfferingStatus: "not_offered" as const,
  featureFlagKey: "business.cross_app.flow",
  featureFlagDefault: false,
  requiredPlanId: "business" as const,
  publicEntryVisibleWhileNotOffered: false,
  failClosed: true,
} as const;

export function isSharedPlanId(value: unknown): value is SharedPlanId {
  return typeof value === "string"
    && supportedPlanIds.includes(value as SharedPlanId);
}

export function canUseBusinessIntegration(input: {
  planId: SharedPlanId;
  offeringStatus: BusinessOfferingStatus;
  featureEnabled: boolean;
}): boolean {
  return input.planId === businessPlanContract.requiredPlanId
    && input.offeringStatus === "available"
    && input.featureEnabled;
}
