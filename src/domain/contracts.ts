import type { Timestamp } from "./common";

export type StudioEventType =
  | "studio.session.started.v1"
  | "studio.session.completed.v1"
  | "studio.report.generated.v1"
  | "studio.service_reference.updated.v1";

export type SnsPlannerEventType =
  | "sns.post_draft.created.v1"
  | "sns.post_draft.updated.v1";

export type AiPlatformEventType =
  | "ai.activity.created.v1"
  | "ai.activity.completed.v1"
  | "ai.activity.failed.v1"
  | "ai.usage.recorded.v1";

export type GrowthEventType =
  | "growth.lead.converted.v1"
  | "growth.customer.created.v1"
  | "growth.customer.updated.v1"
  | "growth.reservation.created.v1"
  | "growth.reservation.cancelled.v1";

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
  "growth.lead.converted.v1",
  "growth.customer.created.v1",
  "growth.customer.updated.v1",
  "growth.reservation.created.v1",
  "growth.reservation.cancelled.v1",
  "studio.session.started.v1",
  "studio.session.completed.v1",
  "studio.report.generated.v1",
  "studio.service_reference.updated.v1",
  "ai.activity.created.v1",
  "sns.post_draft.created.v1",
  "sns.post_draft.updated.v1",
  "ai.activity.completed.v1",
  "ai.activity.failed.v1",
  "ai.usage.recorded.v1"
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
