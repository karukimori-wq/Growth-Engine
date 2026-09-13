import type { WorkspaceContext } from "./workspace";
import {
  businessPlanContract,
  canUseBusinessIntegration,
} from "@/domain/plan-contract";
import { AuthorizationError, requireActiveUser } from "./authz";

export const businessCrossAppFlowEnvKey = "BUSINESS_CROSS_APP_FLOW_ENABLED" as const;

export function isBusinessCrossAppFlowEnabled(
  value = process.env.BUSINESS_CROSS_APP_FLOW_ENABLED,
): boolean {
  return value === "true";
}

export function canUseFutureBusinessIntegration(
  context: WorkspaceContext,
  featureEnabled = isBusinessCrossAppFlowEnabled(),
): boolean {
  return canUseBusinessIntegration({
    planId: context.workspace.plan,
    availabilityStatus: businessPlanContract.businessAvailabilityStatus,
    featureEnabled,
  });
}

export function requireFutureBusinessIntegrationAccess(
  context: WorkspaceContext,
  featureEnabled = isBusinessCrossAppFlowEnabled(),
): void {
  requireActiveUser(context);

  if (!canUseFutureBusinessIntegration(context, featureEnabled)) {
    throw new AuthorizationError("Business cross-app integration is unavailable.");
  }
}
