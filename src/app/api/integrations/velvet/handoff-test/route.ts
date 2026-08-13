import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";

const velvetVisitsUrl =
  process.env.VELVET_VISITS_URL ?? "https://velvet.illusionddt.chatgpt.site/api/visits";

const velvetHandoffTestPayload = {
  workspaceId: "ws_test_001",
  userId: "user_test_owner_001",
  sourceApp: "growth-engine",
  customerId: "customer_test_001",
  reservationId: "reservation_test_001",
  intent: "start_professional_visit"
};

type VelvetVisitResponse = {
  visitId?: unknown;
  id?: unknown;
  workspaceId?: unknown;
  customerId?: unknown;
  status?: unknown;
  summaryRef?: unknown;
  nextActionRef?: unknown;
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

function createResponseHeaders(traceId: string, correlationId: string, requestId: string) {
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

  return new NextResponse(null, {
    status: 204,
    headers: createResponseHeaders(traceId, correlationId, requestId)
  });
}

export async function POST(request: NextRequest) {
  const startedAt = getTimestamp();
  const startedAtMs = Date.now();
  const traceId = request.headers.get("X-Trace-Id") ?? createId("trace");
  const correlationId = request.headers.get("X-Correlation-Id") ?? createId("corr");
  const requestId = createId("req");
  const inboundSourceApp = request.headers.get("X-Source-App") ?? velvetHandoffTestPayload.sourceApp;

  try {
    const upstreamStartedAtMs = Date.now();
    const response = await fetch(velvetVisitsUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Trace-Id": traceId,
        "X-Correlation-Id": correlationId,
        "X-Source-App": velvetHandoffTestPayload.sourceApp
      },
      body: JSON.stringify(velvetHandoffTestPayload),
      cache: "no-store"
    });
    const responseText = await response.text();
    let responseBody: VelvetVisitResponse | { raw: string };

    try {
      responseBody = JSON.parse(responseText) as VelvetVisitResponse;
    } catch {
      responseBody = { raw: responseText };
    }

    const maybeVisit = responseBody as VelvetVisitResponse;
    const recordedVisit = {
      visitId: asString(maybeVisit.visitId) ?? asString(maybeVisit.id),
      workspaceId: asString(maybeVisit.workspaceId) ?? velvetHandoffTestPayload.workspaceId,
      customerId: asString(maybeVisit.customerId) ?? velvetHandoffTestPayload.customerId,
      status: asString(maybeVisit.status),
      summaryRef: asString(maybeVisit.summaryRef),
      nextActionRef: asString(maybeVisit.nextActionRef)
    };
    const errorCode = getUpstreamErrorCode(response.status);
    const inboundApiLog = {
      logType: "api.inbound",
      traceId,
      correlationId,
      requestId,
      sourceApp: inboundSourceApp,
      targetApp: velvetHandoffTestPayload.sourceApp,
      operation: "GrowthEngine.VelvetHandoffTest",
      endpoint: "POST /api/integrations/velvet/handoff-test",
      workspaceId: velvetHandoffTestPayload.workspaceId,
      userId: velvetHandoffTestPayload.userId,
      status: getStatus(response.ok),
      statusCode: 200,
      errorCode,
      durationMs: getDurationMs(startedAtMs),
      occurredAt: getTimestamp()
    };
    const outboundApiLog = {
      logType: "api.outbound",
      traceId,
      correlationId,
      sourceApp: velvetHandoffTestPayload.sourceApp,
      targetApp: "velvet",
      operation: "VelvetHandoff.Start",
      endpoint: "POST /api/visits",
      workspaceId: velvetHandoffTestPayload.workspaceId,
      userId: velvetHandoffTestPayload.userId,
      status: getStatus(response.ok),
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
        status: getStatus(response.ok),
        integration: "velvet",
        endpoint: velvetVisitsUrl,
        velvetStatusCode: response.status,
        recordedVisit,
        traceId,
        correlationId,
        requestId,
        eventName: "velvet.visit.started.v1",
        inboundApiLog,
        outboundApiLog,
        dataSafety: {
          customerMasterSent: false,
          paymentStatusSentOutsideGrowthEngine: false,
          salesAmountSentOutsideGrowthEngine: false,
          stripeDataSent: false,
          fullProfessionalNoteSent: false,
          fullProfessionalMemorySent: false,
          apiKeysSent: false,
          secretPromptSent: false
        },
        error: errorCode
          ? {
              code: errorCode,
              message: "Velvet returned an unexpected response.",
              retryable: errorCode !== "BAD_REQUEST" && errorCode !== "CONTRACT_VIOLATION",
              sourceApp: velvetHandoffTestPayload.sourceApp,
              targetApp: "velvet",
              traceId,
              correlationId
            }
          : null,
        velvetResponse: responseBody,
        startedAt,
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
      targetApp: velvetHandoffTestPayload.sourceApp,
      operation: "GrowthEngine.VelvetHandoffTest",
      endpoint: "POST /api/integrations/velvet/handoff-test",
      workspaceId: velvetHandoffTestPayload.workspaceId,
      userId: velvetHandoffTestPayload.userId,
      status: "error",
      statusCode: 200,
      errorCode,
      durationMs: getDurationMs(startedAtMs),
      occurredAt: getTimestamp()
    };
    const outboundApiLog = {
      logType: "api.outbound",
      traceId,
      correlationId,
      sourceApp: velvetHandoffTestPayload.sourceApp,
      targetApp: "velvet",
      operation: "VelvetHandoff.Start",
      endpoint: "POST /api/visits",
      workspaceId: velvetHandoffTestPayload.workspaceId,
      userId: velvetHandoffTestPayload.userId,
      status: "error",
      statusCode: null,
      errorCode,
      durationMs: getDurationMs(startedAtMs),
      occurredAt: getTimestamp()
    };

    console.log(JSON.stringify(inboundApiLog));
    console.log(JSON.stringify(outboundApiLog));

    return NextResponse.json(
      {
        appName,
        status: "error",
        integration: "velvet",
        endpoint: velvetVisitsUrl,
        velvetStatusCode: null,
        recordedVisit: null,
        traceId,
        correlationId,
        requestId,
        eventName: "velvet.visit.started.v1",
        inboundApiLog,
        outboundApiLog,
        dataSafety: {
          customerMasterSent: false,
          paymentStatusSentOutsideGrowthEngine: false,
          salesAmountSentOutsideGrowthEngine: false,
          stripeDataSent: false,
          fullProfessionalNoteSent: false,
          fullProfessionalMemorySent: false,
          apiKeysSent: false,
          secretPromptSent: false
        },
        error: {
          code: errorCode,
          message: "Velvet request failed.",
          retryable: errorCode !== "INTERNAL_ERROR",
          sourceApp: velvetHandoffTestPayload.sourceApp,
          targetApp: "velvet",
          traceId,
          correlationId
        },
        startedAt,
        timestamp: getTimestamp()
      },
      { status: 200, headers: createResponseHeaders(traceId, correlationId, requestId) }
    );
  }
}
