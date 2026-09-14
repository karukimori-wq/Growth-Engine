import { customers, demoWorkspace, products, todayReservations } from "@/lib/mock-data";

export const practitionerUserId = demoWorkspace.ownerUserId;

function normalizedBaseUrl(value: string | undefined, fallback: string) {
  return (value?.trim() || fallback).replace(/\/$/, "");
}

// Server-side configuration allows Professional app domains to move without a Growth Engine code change.
// Keep the current production endpoints as safe fallbacks when an optional override is absent.
export const numeriaStudioBaseUrl = normalizedBaseUrl(
  process.env.NUMERIA_STUDIO_BASE_URL,
  "https://numeria-studio.com"
);
export const velvetBaseUrl = normalizedBaseUrl(process.env.VELVET_BASE_URL, "");
export const snsPlannerBaseUrl = normalizedBaseUrl(
  process.env.SNS_PLANNER_BASE_URL,
  "https://sns-planner.illusionddt.chatgpt.site"
);

export const mvpReportRef = {
  reportId: "report_reference_pending_mvp",
  reportStatus: "reference_pending",
  sourceOfTruth: "numeria-studio",
  reportBodyCopiedToGrowthEngine: false
};

export const mvpFollowupContext = {
  followupId: "followup_res_001_post_session",
  reservationId: "res_001",
  customerId: "cus_001",
  sessionId: "session_reference_pending_mvp",
  reportRef: mvpReportRef,
  type: "post_session_followup",
  status: "success",
  recommendedAction: "鑑定後24時間以内に次回案内とレビュー依頼を確認する",
  evidenceRefs: ["reservation:res_001", "report:report_reference_pending_mvp"]
};

export const mvpPostDraftBrief = {
  workspaceId: demoWorkspace.id,
  userId: practitionerUserId,
  sourceApp: "growth-engine",
  objective: "increase_reservations",
  targetAudience: "repeat_customers",
  topic: "今月の数秘メッセージ",
  contentType: "instagram_post",
  channel: "instagram",
  cta: "予約ページを見る",
  destinationUrl: "https://growth-engine.karukimori.workers.dev/public/booking"
};

export type NumeriaHandoffRefs = {
  workspaceId: string;
  userId: string;
  reservationId: string;
  customerId: string;
  traceId: string;
  correlationId: string;
};

export function getReservationForScreen(reservationId: string) {
  const reservation = todayReservations.find((item) => item.id === reservationId) ?? todayReservations[0];
  const customer = customers.find((item) => item.id === reservation.customerId) ?? customers[0];
  const product = products.find((item) => item.id === reservation.productId) ?? products[0];

  return { reservation, customer, product };
}

export function getFollowupForScreen(followupId: string) {
  const followup = followupId === mvpFollowupContext.followupId
    ? mvpFollowupContext
    : { ...mvpFollowupContext, followupId };
  const { reservation, customer, product } = getReservationForScreen(followup.reservationId);

  return { followup, reservation, customer, product };
}

export function createNumeriaStartUrl(refs: NumeriaHandoffRefs) {
  const params = new URLSearchParams({
    workspaceId: refs.workspaceId,
    userId: refs.userId,
    reservationId: refs.reservationId,
    customerId: refs.customerId,
    traceId: refs.traceId,
    correlationId: refs.correlationId,
    intent: "start_appraisal_session"
  });

  return `${numeriaStudioBaseUrl}/app/growth/start?${params.toString()}`;
}

export function createPostDraftBriefUrl(followupId: string) {
  const params = new URLSearchParams({
    followupId,
    reservationId: mvpFollowupContext.reservationId,
    customerId: mvpFollowupContext.customerId,
    traceSource: "mvp_user_screen_flow"
  });

  return `/app/business/post-draft-briefs/new?${params.toString()}`;
}

export const screenFlowSafety = {
  paymentStatusSentOutsideGrowthEngine: false,
  salesAmountSentOutsideGrowthEngine: false,
  reportBodyCopiedToGrowthEngine: false,
  fullMeetingTranscriptSent: false,
  apiKeysSent: false,
  secretPromptSent: false
};
