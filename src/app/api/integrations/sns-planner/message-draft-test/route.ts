import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";

const snsPlannerMessageDraftsUrl =
  "https://sns-planner.illusionddt.chatgpt.site/api/message-drafts";

const messageDraftTestPayload = {
  workspaceId: "ws_test_001",
  userId: "user_test_owner_001",
  sourceApp: "growth-engine",
  targetStudio: "velvet",
  channel: "line",
  purpose: "follow_up",
  audienceSegment: "repeat_candidate",
  tone: "warm",
  cta: "book_next_visit",
  inputRef: {
    customerId: "customer_test_001",
    reservationId: "reservation_test_001",
    followupId: "followup_test_001"
  }
};

type SnsPlannerMessageDraftResponse = {
  messageDraftId?: unknown;
  draftId?: unknown;
  id?: unknown;
  workspaceId?: unknown;
  status?: unknown;
  messageDraftStatus?: unknown;
  channel?: unknown;
  purpose?: unknown;
  traceId?: unknown;
  correlationId?: unknown;
  requestId?: unknown;
  eventName?: unknown;
  error?: unknown;
};

type ErrorCode =
  | "BAD_REQUEST"
  | "CONTRACT_VIOLATION"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "UPSTREAM_BAD_RESPONSE"
  | "ENVIRONMENT_LIMITATION"
  | "INTERNAL_ERROR";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Trace-Id, X-Correlation-Id, X-Source-App"
};

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function createId(prefix: "trace" | "corr" | "req"): string {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

function createResponseHeaders(
  traceId: string,
  correlationId: string,
  requestId: string
) {
  return {
    ...corsHeaders,
    "X-Trace-Id": traceId,
    "X-Correlation-Id": correlationId,
    "X-Request-Id": requestId
  };
}

function getStatus(responseOk: boolean): "success" | "error" {
  return responseOk ? "success" : "error";
}

function getUpstreamErrorCode(statusCode: number): ErrorCode | null {
  if (statusCode >= 200 && statusCode < 300) return null;
  if (statusCode === 400) return "BAD_REQUEST";
  if (statusCode === 422) return "CONTRACT_VIOLATION";
  if (statusCode === 408 || statusCode === 504) return "UPSTREAM_TIMEOUT";
  if (statusCode === 502 || statusCode === 503) return "UPSTREAM_UNAVAILABLE";
  if (statusCode === 522) return "ENVIRONMENT_LIMITATION";
  return "UPSTREAM_BAD_RESPONSE";
}

function getDurationMs(startedAtMs: number): number {
  return Date.now() - startedAtMs;
}

export async function OPTIONS(request: NextRequest) {
  const traceId = request.headers.get("X-Trace-Id") ?? createId("trace");
  const correlationId = request.headers.get("X-Correlation-Id") ?? createId("corr");
  const requestId = createId("req");
  return new NextResponse(null, { status: 204, headers: createResponseHeaders(traceId, correlationId, requestId) });
}

export async function POST(request: NextRequest) {
  const startedAt = getTimestamp();
  const startedAtMs = Date.now();
  const traceId = request.headers.get("X-Trace-Id") ?? createId("trace");
  const correlationId = request.headers.get("X-Correlation-Id") ?? createId("corr");
  const requestId = createId("req");
  const inboundSourceApp = request.headers.get("X-Source-App") ?? messageDraftTestPayload.sourceApp;

  try {
    const upstreamStartedAtMs = Date.now();
    const response = await fetch(snsPlannerMessageDraftsUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Trace-Id": traceId,
        "X-Correlation-Id": correlationId,
        "X-Source-App": messageDraftTestPayload.sourceApp
      },
      body: JSON.stringify(messageDraftTestPayload),
      cache: "no-store"
    });
    const responseText = await response.text();
    let responseBody: SnsPlannerMessageDraftResponse | { raw: string };
    try { responseBody = JSON.parse(responseText) as SnsPlannerMessageDraftResponse; }
    catch { responseBody = { raw: responseText }; }

    const maybeDraft = responseBody as SnsPlannerMessageDraftResponse;
    const recordedMessageDraft = {
      messageDraftId: asString(maybeDraft.messageDraftId) ?? asString(maybeDraft.draftId) ?? asString(maybeDraft.id),
      workspaceId: asString(maybeDraft.workspaceId) ?? messageDraftTestPayload.workspaceId,
      status: asString(maybeDraft.messageDraftStatus) ?? asString(maybeDraft.status),
      channel: asString(maybeDraft.channel) ?? messageDraftTestPayload.channel,
      purpose: asString(maybeDraft.purpose) ?? messageDraftTestPayload.purpose
    };
    const errorCode = getUpstreamErrorCode(response.status);
    const inboundApiLog = {
      logType: "api.inbound", traceId, correlationId, requestId, sourceApp: inboundSourceApp,
      targetApp: messageDraftTestPayload.sourceApp, operation: "GrowthEngine.MessageDraftTest",
      endpoint: "POST /api/integrations/sns-planner/message-draft-test", workspaceId: messageDraftTestPayload.workspaceId,
      userId: messageDraftTestPayload.userId, status: getStatus(response.ok), statusCode: 200,
      errorCode, durationMs: getDurationMs(startedAtMs), occurredAt: getTimestamp()
    };
    const outboundApiLog = {
      logType: "api.outbound", traceId, correlationId, sourceApp: messageDraftTestPayload.sourceApp,
      targetApp: "sns-planner", operation: "MessageDraft.Generate", endpoint: "POST /api/message-drafts",
      workspaceId: messageDraftTestPayload.workspaceId, userId: messageDraftTestPayload.userId,
      status: getStatus(response.ok), statusCode: response.status, errorCode,
      durationMs: getDurationMs(upstreamStartedAtMs), occurredAt: getTimestamp()
    };
    console.log(JSON.stringify(inboundApiLog));
    console.log(JSON.stringify(outboundApiLog));

    return NextResponse.json({
      appName,
      status: getStatus(response.ok),
      integration: "sns-planner",
      operation: "MessageDraft.Generate",
      targetStudio: "velvet",
      endpoint: snsPlannerMessageDraftsUrl,
      snsPlannerStatusCode: response.status,
      recordedMessageDraft,
      traceId, correlationId, requestId,
      eventName: "sns.message_draft.created.v1",
      inboundApiLog, outboundApiLog,
      dataSafety: {
        customerMasterSent: false,
        paymentStatusSentOutsideGrowthEngine: false,
        salesAmountSentOutsideGrowthEngine: false,
        stripeDataSent: false,
        fullProfessionalNotesSent: false,
        fullReportBodySent: false,
        apiKeysSent: false,
        secretPromptSent: false
      },
      error: errorCode ? { code: errorCode, message: "SNS Planner returned an unexpected response.", retryable: errorCode !== "BAD_REQUEST" && errorCode !== "CONTRACT_VIOLATION", sourceApp: messageDraftTestPayload.sourceApp, targetApp: "sns-planner", traceId, correlationId } : null,
      snsPlannerResponse: responseBody,
      startedAt,
      timestamp: getTimestamp()
    }, { status: 200, headers: createResponseHeaders(traceId, correlationId, requestId) });
  } catch (error) {
    const errorCode: ErrorCode = error instanceof TypeError ? "UPSTREAM_UNAVAILABLE" : "INTERNAL_ERROR";
    return NextResponse.json({
      appName, status: "error", integration: "sns-planner", operation: "MessageDraft.Generate", targetStudio: "velvet",
      endpoint: snsPlannerMessageDraftsUrl, snsPlannerStatusCode: null, recordedMessageDraft: null,
      traceId, correlationId, requestId, eventName: "sns.message_draft.created.v1",
      dataSafety: { customerMasterSent:false,paymentStatusSentOutsideGrowthEngine:false,salesAmountSentOutsideGrowthEngine:false,stripeDataSent:false,fullProfessionalNotesSent:false,fullReportBodySent:false,apiKeysSent:false,secretPromptSent:false },
      error: { code: errorCode, message: "SNS Planner request failed.", retryable: errorCode !== "INTERNAL_ERROR", sourceApp: messageDraftTestPayload.sourceApp, targetApp: "sns-planner", traceId, correlationId },
      startedAt, timestamp: getTimestamp()
    }, { status: 200, headers: createResponseHeaders(traceId, correlationId, requestId) });
  }
}
