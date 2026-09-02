import type { PlanId } from "@/domain/common";

export function canAccessBusiness(plan: PlanId): boolean {
  return plan === "business";
}

export function assertBusinessPlan(plan: PlanId): void {
  if (!canAccessBusiness(plan)) {
    throw new Error("Business plan is required to access this feature.");
  }
}
