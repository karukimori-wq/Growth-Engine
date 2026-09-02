export type PlanId = "free" | "pro" | "business";

/** @deprecated Use the shared-contract name PlanId for new code. */
export type Plan = PlanId;

export type Role = "owner" | "admin" | "member";

export type ProfessionalStudioType = "numeria" | "velvet" | "fp" | "coach";

export type Timestamp = string;

export type Money = {
  amount: number;
  currency: string;
};
