export const supportedPlanIds = ["free", "pro", "business"] as const;

export type SharedPlanId = (typeof supportedPlanIds)[number];
export type BusinessAvailabilityStatus = "preparing" | "unavailable" | "available";

/** @deprecated Use BusinessAvailabilityStatus for new Business release readiness code. */
export type BusinessOfferingStatus = BusinessAvailabilityStatus;

export const businessPlanContract = {
  planIdField: "planId",
  businessAvailabilityStatus: "unavailable" as const,
  businessOfferingStatus: "unavailable" as const,
  featureFlagKey: "business.cross_app.flow",
  featureFlagDefault: false,
  requiredPlanId: "business" as const,
  publicEntryVisibleWhileUnavailable: false,
  /** @deprecated Use publicEntryVisibleWhileUnavailable. */
  publicEntryVisibleWhileNotOffered: false,
  normalUserPurchaseVisible: false,
  failClosed: true,
} as const;

export function isSharedPlanId(value: unknown): value is SharedPlanId {
  return typeof value === "string"
    && supportedPlanIds.includes(value as SharedPlanId);
}

export function canUseBusinessIntegration(input: {
  planId: SharedPlanId;
  availabilityStatus: BusinessAvailabilityStatus;
  featureEnabled: boolean;
}): boolean {
  return input.planId === businessPlanContract.requiredPlanId
    && input.availabilityStatus === "available"
    && input.featureEnabled;
}

export function isBusinessPublicEntryVisible(
  availabilityStatus: BusinessAvailabilityStatus,
): boolean {
  return availabilityStatus === "available";
}

export function isBusinessPurchasableByNormalUser(
  availabilityStatus: BusinessAvailabilityStatus,
): boolean {
  return availabilityStatus === "available";
}
