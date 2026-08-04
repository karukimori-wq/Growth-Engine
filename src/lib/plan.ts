import type { Plan } from "@/domain/common";

export function canAccessBusiness(plan: Plan): boolean {
  return plan === "business";
}

export function assertBusinessPlan(plan: Plan): void {
  if (!canAccessBusiness(plan)) {
    throw new Error("Business plan is required to access this feature.");
  }
}
