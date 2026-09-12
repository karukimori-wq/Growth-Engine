export const growthEngineSourceOfTruth = [
  "Customer",
  "Reservation",
  "Payment",
  "Sales",
  "Public Site",
  "Business plan workflow",
] as const;

export const professionalReturnAllowedFields = [
  "workspaceId",
  "userId",
  "customerId",
  "reservationId",
  "sessionId",
  "reportId",
  "reportRef",
  "status",
  "completedAt",
  "sourceApp",
  "correlationId",
] as const;

export const professionalReturnForbiddenFields = [
  "appraisalText",
  "fullAppraisalText",
  "reportText",
  "fullReportText",
  "conversationText",
  "fullConversationText",
  "paymentDetails",
  "paymentStatus",
  "salesDetails",
  "salesAmount",
  "customerMaster",
  "fullCustomerMaster",
  "stripe",
  "stripePaymentIntentId",
  "stripeCheckoutSessionId",
  "secret",
  "apiKey",
  "secretPrompt",
] as const;

export type ProfessionalReturnAllowedField = (typeof professionalReturnAllowedFields)[number];
export type ProfessionalReturnForbiddenField = (typeof professionalReturnForbiddenFields)[number];

const allowedFieldSet = new Set<string>(professionalReturnAllowedFields);
const forbiddenFieldSet = new Set<string>(professionalReturnForbiddenFields);

export type ProfessionalReturnBoundaryResult = {
  acceptedFields: string[];
  rejectedFields: string[];
  unknownFields: string[];
  ok: boolean;
};

export function evaluateProfessionalReturnPayload(
  payload: Record<string, unknown>,
): ProfessionalReturnBoundaryResult {
  const acceptedFields: string[] = [];
  const rejectedFields: string[] = [];
  const unknownFields: string[] = [];

  for (const key of Object.keys(payload)) {
    if (forbiddenFieldSet.has(key)) {
      rejectedFields.push(key);
    } else if (allowedFieldSet.has(key)) {
      acceptedFields.push(key);
    } else {
      unknownFields.push(key);
    }
  }

  return {
    acceptedFields,
    rejectedFields,
    unknownFields,
    ok: rejectedFields.length === 0 && unknownFields.length === 0,
  };
}
