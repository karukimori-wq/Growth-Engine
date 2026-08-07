import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";

const aiPlatformCoreActivitiesUrl =
  "https://ai-platform-core-preview.illusionddt.chatgpt.site/api/activities";

const activityTestPayload = {
  workspaceId: "ws_test_001",
  userId: "user_test_owner_001",
  sourceApp: "growth-engine",
  activityType: "growth.recommendation.created",
  capability: "growth.recommendation.generate",
  inputRef: {
    recommendationId: "rec_test_001",
    contextType: "followup",
    targetType: "customer_segment"
  }
};

type AiPlatformCoreResponse = {
  activityId?: unknown;
  id?: unknown;
  workspaceId?: unknown;
  status?: unknown;
  sourceApp?: unknown;
  capability?: unknown;
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
    request.headers.get("X-Source-App") ?? activityTestPayload.sourceApp;

  try {
    const upstreamStartedAtMs = Date.now();
    const response = await fetch(aiPlatformCoreActivitiesUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Trace-Id": traceId,
        "X-Correlation-Id": correlationId,
        "X-Source-App": activityTestPayload.sourceApp
      },
      body: JSON.stringify(activityTestPayload),
      cache: "no-store"
    });
    const responseText = await response.text();
    let responseBody: AiPlatformCoreResponse | { raw: string };

    try {
      responseBody = JSON.parse(responseText) as AiPlatformCoreResponse;
    } catch {
      responseBody = { raw: responseText };
    }

    const maybeActivity = responseBody as AiPlatformCoreResponse;
    const recordedActivity = {
      activityId:
        asString(maybeActivity.activityId) ?? asString(maybeActivity.id),
      workspaceId:
        asString(maybeActivity.workspaceId) ?? activityTestPayload.workspaceId,
      status: asString(maybeActivity.status),
      sourceApp:
        asString(maybeActivity.sourceApp) ?? activityTestPayload.sourceApp,
      capability:
        asString(maybeActivity.capability) ?? activityTestPayload.capability
    };
    const errorCode = getUpstreamErrorCode(response.status);
    const outboundApiLog = {
      logType: "api.outbound",
      traceId,
      correlationId,
      sourceApp: activityTestPayload.sourceApp,
      targetApp: "ai-platform-core",
      operation: "Activity.Create",
      endpoint: "POST /api/activities",
      workspaceId: activityTestPayload.workspaceId,
      userId: activityTestPayload.userId,
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
      targetApp: activityTestPayload.sourceApp,
      operation: "GrowthEngine.ActivityTest",
      endpoint: "POST /api/integrations/ai-platform-core/activity-test",
      workspaceId: activityTestPayload.workspaceId,
      userId: activityTestPayload.userId,
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
        integration: "ai-platform-core",
        endpoint: aiPlatformCoreActivitiesUrl,
        requestPayload: activityTestPayload,
        aiPlatformCoreStatusCode: response.status,
        recordedActivity,
        traceId,
        correlationId,
        requestId,
        eventName: "ai.activity.created.v1",
        inboundApiLog,
        outboundApiLog,
        error: errorCode
          ? {
              code: errorCode,
              message: "AI Platform Core returned an unexpected response.",
              retryable:
                errorCode === "UPSTREAM_TIMEOUT" ||
                errorCode === "UPSTREAM_UNAVAILABLE" ||
                errorCode === "UPSTREAM_BAD_RESPONSE",
              sourceApp: activityTestPayload.sourceApp,
              targetApp: "ai-platform-core",
              traceId,
              correlationId
            }
          : null,
        aiPlatformCoreResponse: responseBody,
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
      targetApp: activityTestPayload.sourceApp,
      operation: "GrowthEngine.ActivityTest",
      endpoint: "POST /api/integrations/ai-platform-core/activity-test",
      workspaceId: activityTestPayload.workspaceId,
      userId: activityTestPayload.userId,
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
      sourceApp: activityTestPayload.sourceApp,
      targetApp: "ai-platform-core",
      operation: "Activity.Create",
      endpoint: "POST /api/activities",
      workspaceId: activityTestPayload.workspaceId,
      userId: activityTestPayload.userId,
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
        integration: "ai-platform-core",
        endpoint: aiPlatformCoreActivitiesUrl,
        aiPlatformCoreStatusCode: null,
        recordedActivity: null,
        traceId,
        correlationId,
        requestId,
        eventName: "ai.activity.created.v1",
        inboundApiLog,
        outboundApiLog,
        error: {
          code: errorCode,
          message: "AI Platform Core request failed.",
          retryable: errorCode !== "INTERNAL_ERROR",
          sourceApp: activityTestPayload.sourceApp,
          targetApp: "ai-platform-core",
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
