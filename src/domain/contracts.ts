import type { Timestamp } from "./common";

export type StudioEventType =
  | "studio.session.started.v1"
  | "studio.session.completed.v1"
  | "studio.report.generated.v1";

export type SnsPlannerEventType =
  | "sns.post_draft.created.v1"
  | "sns.post_draft.updated.v1";

export type AiPlatformEventType = "ai.activity.completed.v1";

export type GrowthEventType =
  | "growth.lead.created.v1"
  | "growth.lead.updated.v1"
  | "growth.lead.converted.v1"
  | "growth.customer.created.v1"
  | "growth.customer.updated.v1"
  | "growth.campaign.created.v1"
  | "growth.content_brief.requested.v1"
  | "growth.reservation.requested.v1"
  | "growth.reservation.created.v1"
  | "growth.reservation.confirmed.v1"
  | "growth.reservation.cancelled.v1"
  | "growth.payment.completed.v1"
  | "growth.payment.refunded.v1"
  | "growth.followup.scheduled.v1"
  | "growth.followup.completed.v1"
  | "growth.review.requested.v1"
  | "growth.referral.created.v1"
  | "growth.repeat.booked.v1";

export type PlatformEventType =
  | GrowthEventType
  | StudioEventType
  | SnsPlannerEventType
  | AiPlatformEventType;

export type EventSource = "growth-engine" | "numeria-studio" | "sns-planner" | "ai-platform-core";

export type EventEnvelope<TPayload> = {
  eventId: string;
  eventType: PlatformEventType;
  version: 1;
  source: EventSource;
  workspaceId: string;
  occurredAt: Timestamp;
  correlationId?: string;
  payload: TPayload;
};

export const approvedEventTypes: readonly PlatformEventType[] = [
  "growth.lead.created.v1",
  "growth.lead.updated.v1",
  "growth.lead.converted.v1",
  "growth.customer.created.v1",
  "growth.customer.updated.v1",
  "growth.campaign.created.v1",
  "growth.content_brief.requested.v1",
  "growth.reservation.requested.v1",
  "growth.reservation.created.v1",
  "growth.reservation.confirmed.v1",
  "growth.reservation.cancelled.v1",
  "growth.payment.completed.v1",
  "growth.payment.refunded.v1",
  "growth.followup.scheduled.v1",
  "growth.followup.completed.v1",
  "growth.review.requested.v1",
  "growth.referral.created.v1",
  "growth.repeat.booked.v1",
  "studio.session.started.v1",
  "studio.session.completed.v1",
  "studio.report.generated.v1",
  "sns.post_draft.created.v1",
  "sns.post_draft.updated.v1",
  "ai.activity.completed.v1"
];

export function isApprovedEventType(eventType: string): eventType is PlatformEventType {
  return approvedEventTypes.includes(eventType as PlatformEventType);
}

export type ReportCapability = "Report.Generate" | "Report.Preview" | "Report.ExportPdf";

export type AiCapability =
  | ReportCapability
  | "MarketingInsight.Generate"
  | "ContentBrief.Generate"
  | "Followup.Recommend"
  | "Funnel.Analyze";
