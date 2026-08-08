import { customers, demoWorkspace, products, todayReservations } from "@/lib/mock-data";

export const practitionerUserId = demoWorkspace.ownerUserId;
export const numeriaStudioBaseUrl = "https://numeria-studio.illusionddt.chatgpt.site";
export const snsPlannerBaseUrl = "https://sns-planner.illusionddt.chatgpt.site";

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
  destinationUrl: "https://growth-engine-ruby-nine.vercel.app/public/booking"
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

export function createNumeriaStartUrl(reservationId: string, customerId: string) {
  const params = new URLSearchParams({
    workspaceId: demoWorkspace.id,
    userId: practitionerUserId,
    sourceApp: "growth-engine",
    reservationId,
    customerId,
    sessionType: "numerology",
    intent: "start_appraisal_session",
    returnUrl: `https://growth-engine-ruby-nine.vercel.app/app/business/followups/${mvpFollowupContext.followupId}`
  });

  return `${numeriaStudioBaseUrl}/app/sessions/start?${params.toString()}`;
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
