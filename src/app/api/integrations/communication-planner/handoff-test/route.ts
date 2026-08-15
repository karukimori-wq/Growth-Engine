import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";

const communicationPlannerHandoffUrl = process.env.COMMUNICATION_PLANNER_HANDOFF_URL;

const testPayload = {
  workspaceId: "ws_test_001",
  userId: "user_test_owner_001",
  sourceApp: "growth-engine",
  customerId: "customer_test_001",
  personId: "person_test_001",
  conversationId: "conversation_test_001",
  purpose: "follow_up_context",
  inputRef: {
    followupId: "followup_test_001",
    reservationId: "reservation_test_001",
    businessReason: "repeat_followup"
  }
};

type ErrorCode =
  | "BAD_REQUEST"
  | "CONTRACT_VIOLATION"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "UPSTREAM_BAD_RESPONSE"
  | "ENVIRONMENT_LIMITATION"
  | "INTERNAL_ERROR";

type CommunicationPlannerResponse = {
  status?: unknown;
  personId?: unknown;
  conversationId?: unknown;
  replyDraftId?: unknown;
  safetyCheckId?: unknown;
  nextActionId?: unknown;
  messageRef?: unknown;
  traceId?: unknown;
  correlationId?: unknown;
  requestId?: unknown;
  eventName?: unknown;
};

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

function createResponseHeaders(traceId: string, correlationId: string, requestId: string) {
  return {
    ...corsHeaders,
    "X-Trace-Id": traceId,
    "X-Correlation-Id": correlationId,
    "X-Request-Id": requestId
  };
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

function getDataSafety() {
  return {
    customerMasterSent: false,
    paymentStatusSentOutsideGrowthEngine: false,
    salesAmountSentOutsideGrowthEngine: false,
    stripeDataSent: false,
    fullConversationHistorySent: false,
    fullConversationContextBodySent: false,
    fullReportBodySent: false,
    fullProfessionalMemoryBodySent: false,
    apiKeysSent: false,
    secretPromptSent: false
  };
}

export async function OPTIONS(request: NextRequest) {
  const traceId = request.headers.get("X-Trace-Id") ?? createId("trace");
  const correlationId = request.headers.get("X-Correlation-Id") ?? createId("corr");
  const requestId = createId("req");

  return new NextResponse(null, {
    status: 204,
    headers: createResponseHeaders(traceId, correlationId, requestId)
  });
}

export async function POST(request: NextRequest) {
  const startedAtMs = Date.now();
  const traceId = request.headers.get("X-Trace-Id") ?? createId("trace");
  const correlationId = request.headers.get("X-Correlation-Id") ?? createId("corr");
  const requestId = createId("req");
  const inboundSourceApp = request.headers.get("X-Source-App") ?? appName;
  const payload = {
    ...testPayload,
    traceId,
    correlationId
  };

  if (!communicationPlannerHandoffUrl) {
    const inboundApiLog = {
      logType: "api.inbound",
      traceId,
      correlationId,
      requestId,
      sourceApp: inboundSourceApp,
      targetApp: appName,
      operation: "GrowthEngine.CommunicationPlannerHandoffTest",
      endpoint: "POST /api/integrations/communication-planner/handoff-test",
      workspaceId: testPayload.workspaceId,
      userId: testPayload.userId,
      status: "warning",
      statusCode: 200,
      errorCode: "UPSTREAM_UNAVAILABLE",
      durationMs: getDurationMs(startedAtMs),
      occurredAt: getTimestamp()
    };

    console.log(JSON.stringify(inboundApiLog));

    return NextResponse.json(
      {
        appName,
        status: "warning",
        integration: "communication-planner",
        communicationPlannerStatusCode: null,
        endpoint: null,
        recordedHandoff: null,
        traceId,
        correlationId,
        requestId,
        eventName: null,
        sentPayload: payload,
        inboundApiLog,
        outboundApiLog: null,
        dataSafety: getDataSafety(),
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message:
            "COMMUNICATION_PLANNER_HANDOFF_URL is not configured. Reference-only payload contract is ready, but upstream execution was skipped.",
          retryable: true,
          sourceApp: appName,
          targetApp: "communication-planner",
          traceId,
          correlationId
        },
        issues: ["COMMUNICATION_PLANNER_HANDOFF_URL is not configured."],
        timestamp: getTimestamp()
      },
      { status: 200, headers: createResponseHeaders(traceId, correlationId, requestId) }
    );
  }

  try {
    const upstreamStartedAtMs = Date.now();
    const response = await fetch(communicationPlannerHandoffUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Trace-Id": traceId,
        "X-Correlation-Id": correlationId,
        "X-Source-App": appName
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
    const responseText = await response.text();
    let responseBody: CommunicationPlannerResponse | { raw: string };

    try {
      responseBody = JSON.parse(responseText) as CommunicationPlannerResponse;
    } catch {
      responseBody = { raw: responseText };
    }

    const body = responseBody as CommunicationPlannerResponse;
    const errorCode = getUpstreamErrorCode(response.status);
    const status = response.ok ? "success" : "error";
    const recordedHandoff = {
      personId: asString(body.personId) ?? testPayload.personId,
      conversationId: asString(body.conversationId) ?? testPayload.conversationId,
      replyDraftId: asString(body.replyDraftId),
      safetyCheckId: asString(body.safetyCheckId),
      nextActionId: asString(body.nextActionId),
      messageRef: asString(body.messageRef)
    };
    const inboundApiLog = {
      logType: "api.inbound",
      traceId,
      correlationId,
      requestId,
      sourceApp: inboundSourceApp,
      targetApp: appName,
      operation: "GrowthEngine.CommunicationPlannerHandoffTest",
      endpoint: "POST /api/integrations/communication-planner/handoff-test",
      workspaceId: testPayload.workspaceId,
      userId: testPayload.userId,
      status,
      statusCode: 200,
      errorCode,
      durationMs: getDurationMs(startedAtMs),
      occurredAt: getTimestamp()
    };
    const outboundApiLog = {
      logType: "api.outbound",
      traceId,
      correlationId,
      sourceApp: appName,
      targetApp: "communication-planner",
      operation: "CommunicationPlanner.Handoff",
      endpoint: communicationPlannerHandoffUrl,
      workspaceId: testPayload.workspaceId,
      userId: testPayload.userId,
      status,
      statusCode: response.status,
      errorCode,
      durationMs: getDurationMs(upstreamStartedAtMs),
      occurredAt: getTimestamp()
    };

    console.log(JSON.stringify(inboundApiLog));
    console.log(JSON.stringify(outboundApiLog));

    return NextResponse.json(
      {
        appName,
        status,
        integration: "communication-planner",
        communicationPlannerStatusCode: response.status,
        endpoint: communicationPlannerHandoffUrl,
        recordedHandoff,
        traceId,
        correlationId,
        requestId,
        eventName: asString(body.eventName),
        inboundApiLog,
        outboundApiLog,
        dataSafety: getDataSafety(),
        error: errorCode
          ? {
              code: errorCode,
              message: "Communication Planner returned an unexpected response.",
              retryable: errorCode !== "BAD_REQUEST" && errorCode !== "CONTRACT_VIOLATION",
              sourceApp: appName,
              targetApp: "communication-planner",
              traceId,
              correlationId
            }
          : null,
        communicationPlannerResponse: responseBody,
        timestamp: getTimestamp()
      },
      { status: 200, headers: createResponseHeaders(traceId, correlationId, requestId) }
    );
  } catch (error) {
    const errorCode: ErrorCode = error instanceof TypeError ? "UPSTREAM_UNAVAILABLE" : "INTERNAL_ERROR";
    const inboundApiLog = {
      logType: "api.inbound",
      traceId,
      correlationId,
      requestId,
      sourceApp: inboundSourceApp,
      targetApp: appName,
      operation: "GrowthEngine.CommunicationPlannerHandoffTest",
      endpoint: "POST /api/integrations/communication-planner/handoff-test",
      workspaceId: testPayload.workspaceId,
      userId: testPayload.userId,
      status: "error",
      statusCode: 200,
      errorCode,
      durationMs: getDurationMs(startedAtMs),
      occurredAt: getTimestamp()
    };

    console.log(JSON.stringify(inboundApiLog));

    return NextResponse.json(
      {
        appName,
        status: "error",
        integration: "communication-planner",
        communicationPlannerStatusCode: null,
        endpoint: communicationPlannerHandoffUrl,
        recordedHandoff: null,
        traceId,
        correlationId,
        requestId,
        eventName: null,
        inboundApiLog,
        outboundApiLog: null,
        dataSafety: getDataSafety(),
        error: {
          code: errorCode,
          message: "Growth Engine could not reach Communication Planner.",
          retryable: true,
          sourceApp: appName,
          targetApp: "communication-planner",
          traceId,
          correlationId
        },
        issues: ["Communication Planner upstream call failed."],
        timestamp: getTimestamp()
      },
      { status: 200, headers: createResponseHeaders(traceId, correlationId, requestId) }
    );
  }
}
