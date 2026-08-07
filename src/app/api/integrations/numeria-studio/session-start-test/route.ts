import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";

const numeriaStudioSessionStartUrl =
  "https://numeria-studio.illusionddt.chatgpt.site/api/sessions/start";

const sessionStartTestPayload = {
  workspaceId: "ws_test_001",
  userId: "user_test_owner_001",
  sourceApp: "growth-engine",
  reservationId: "reservation_test_001",
  customerRef: {
    customerId: "customer_test_001"
  },
  sessionType: "numerology",
  intent: "start_appraisal_session"
};

type NumeriaStudioResponse = {
  sessionId?: unknown;
  id?: unknown;
  workspaceId?: unknown;
  status?: unknown;
  sourceApp?: unknown;
  sessionType?: unknown;
  traceId?: unknown;
  correlationId?: unknown;
  requestId?: unknown;
  eventName?: unknown;
  error?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

type ErrorCode =
  | "BAD_REQUEST"
  | "CONTRACT_VIOLATION"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "UPSTREAM_BAD_RESPONSE"
  | "INTERNAL_ERROR";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Trace-Id, X-Correlation-Id, X-Source-App"
};

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
  if (statusCode >= 200 && statusCode < 300) {
    return null;
  }

  if (statusCode === 400) {
    return "BAD_REQUEST";
  }

  if (statusCode === 422) {
    return "CONTRACT_VIOLATION";
  }

  if (statusCode === 408 || statusCode === 504) {
    return "UPSTREAM_TIMEOUT";
  }

  if (statusCode === 502 || statusCode === 503 || statusCode === 522) {
    return "UPSTREAM_UNAVAILABLE";
  }

  return "UPSTREAM_BAD_RESPONSE";
}

function getDurationMs(startedAtMs: number): number {
  return Date.now() - startedAtMs;
}

export async function OPTIONS(request: NextRequest) {
  const traceId = request.headers.get("X-Trace-Id") ?? createId("trace");
  const correlationId =
    request.headers.get("X-Correlation-Id") ?? createId("corr");
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
  const correlationId =
    request.headers.get("X-Correlation-Id") ?? createId("corr");
  const requestId = createId("req");
  const inboundSourceApp =
    request.headers.get("X-Source-App") ?? sessionStartTestPayload.sourceApp;

  try {
    const upstreamStartedAtMs = Date.now();
    const response = await fetch(numeriaStudioSessionStartUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Trace-Id": traceId,
        "X-Correlation-Id": correlationId,
        "X-Source-App": sessionStartTestPayload.sourceApp
      },
      body: JSON.stringify(sessionStartTestPayload),
      cache: "no-store"
    });
    const responseText = await response.text();
    let responseBody: NumeriaStudioResponse | { raw: string };

    try {
      responseBody = JSON.parse(responseText) as NumeriaStudioResponse;
    } catch {
      responseBody = { raw: responseText };
    }

    const maybeSession = responseBody as NumeriaStudioResponse;
    const recordedSession = {
      sessionId: asString(maybeSession.sessionId) ?? asString(maybeSession.id),
      workspaceId:
        asString(maybeSession.workspaceId) ??
        sessionStartTestPayload.workspaceId,
      status: asString(maybeSession.status),
      sourceApp:
        asString(maybeSession.sourceApp) ??
        sessionStartTestPayload.sourceApp,
      sessionType:
        asString(maybeSession.sessionType) ??
        sessionStartTestPayload.sessionType
    };
    const errorCode = getUpstreamErrorCode(response.status);
    const outboundApiLog = {
      logType: "api.outbound",
      traceId,
      correlationId,
      sourceApp: sessionStartTestPayload.sourceApp,
      targetApp: "numeria-studio",
      operation: "Session.Start",
      endpoint: "POST /api/sessions/start",
      workspaceId: sessionStartTestPayload.workspaceId,
      userId: sessionStartTestPayload.userId,
      status: getStatus(response.ok),
      statusCode: response.status,
      errorCode,
      durationMs: getDurationMs(upstreamStartedAtMs),
      occurredAt: getTimestamp()
    };
    const inboundApiLog = {
      logType: "api.inbound",
      traceId,
      correlationId,
      requestId,
      sourceApp: inboundSourceApp,
      targetApp: sessionStartTestPayload.sourceApp,
      operation: "GrowthEngine.SessionStartTest",
      endpoint: "POST /api/integrations/numeria-studio/session-start-test",
      workspaceId: sessionStartTestPayload.workspaceId,
      userId: sessionStartTestPayload.userId,
      status: getStatus(response.ok),
      statusCode: 200,
      errorCode,
      durationMs: getDurationMs(startedAtMs),
      occurredAt: getTimestamp()
    };

    console.log(JSON.stringify(inboundApiLog));
    console.log(JSON.stringify(outboundApiLog));

    return NextResponse.json(
      {
        appName,
        status: response.ok ? "ok" : "error",
        integration: "numeria-studio",
        endpoint: numeriaStudioSessionStartUrl,
        requestPayload: sessionStartTestPayload,
        numeriaStudioStatusCode: response.status,
        recordedSession,
        traceId,
        correlationId,
        requestId,
        eventName: "studio.session.started.v1",
        inboundApiLog,
        outboundApiLog,
        error: errorCode
          ? {
              code: errorCode,
              message: "Numeria Studio returned an unexpected response.",
              retryable:
                errorCode === "UPSTREAM_TIMEOUT" ||
                errorCode === "UPSTREAM_UNAVAILABLE" ||
                errorCode === "UPSTREAM_BAD_RESPONSE",
              sourceApp: sessionStartTestPayload.sourceApp,
              targetApp: "numeria-studio",
              traceId,
              correlationId
            }
          : null,
        numeriaStudioResponse: responseBody,
        startedAt,
        timestamp: getTimestamp()
      },
      {
        status: 200,
        headers: createResponseHeaders(traceId, correlationId, requestId)
      }
    );
  } catch (error) {
    const errorCode: ErrorCode =
      error instanceof TypeError ? "UPSTREAM_UNAVAILABLE" : "INTERNAL_ERROR";
    const inboundApiLog = {
      logType: "api.inbound",
      traceId,
      correlationId,
      requestId,
      sourceApp: inboundSourceApp,
      targetApp: sessionStartTestPayload.sourceApp,
      operation: "GrowthEngine.SessionStartTest",
      endpoint: "POST /api/integrations/numeria-studio/session-start-test",
      workspaceId: sessionStartTestPayload.workspaceId,
      userId: sessionStartTestPayload.userId,
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
      sourceApp: sessionStartTestPayload.sourceApp,
      targetApp: "numeria-studio",
      operation: "Session.Start",
      endpoint: "POST /api/sessions/start",
      workspaceId: sessionStartTestPayload.workspaceId,
      userId: sessionStartTestPayload.userId,
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
        integration: "numeria-studio",
        endpoint: numeriaStudioSessionStartUrl,
        numeriaStudioStatusCode: null,
        recordedSession: null,
        traceId,
        correlationId,
        requestId,
        eventName: "studio.session.started.v1",
        inboundApiLog,
        outboundApiLog,
        error: {
          code: errorCode,
          message: "Numeria Studio request failed.",
          retryable: errorCode !== "INTERNAL_ERROR",
          sourceApp: sessionStartTestPayload.sourceApp,
          targetApp: "numeria-studio",
          traceId,
          correlationId
        },
        startedAt,
        timestamp: getTimestamp()
      },
      {
        status: 200,
        headers: createResponseHeaders(traceId, correlationId, requestId)
      }
    );
  }
}
