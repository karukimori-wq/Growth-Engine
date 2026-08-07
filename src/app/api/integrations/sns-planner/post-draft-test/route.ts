import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";

const snsPlannerPostDraftsUrl =
  "https://sns-planner.illusionddt.chatgpt.site/api/post-drafts";

const postDraftTestPayload = {
  workspaceId: "ws_test_001",
  userId: "user_test_owner_001",
  sourceApp: "growth-engine",
  objective: "increase_reservations",
  targetAudience: "repeat_customers",
  topic: "今月の数秘メッセージ",
  contentType: "instagram_post",
  channel: "instagram",
  cta: "予約ページを見る",
  destinationUrl:
    "https://growth-engine-api-preview.illusionddt.chatgpt.site/test-booking"
};

type SnsPlannerResponse = {
  draftId?: unknown;
  id?: unknown;
  workspaceId?: unknown;
  status?: unknown;
  channel?: unknown;
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
  if (statusCode === 502 || statusCode === 503) {
    return "UPSTREAM_UNAVAILABLE";
  }
  if (statusCode === 522) {
    return "ENVIRONMENT_LIMITATION";
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
    request.headers.get("X-Source-App") ?? postDraftTestPayload.sourceApp;

  try {
    const upstreamStartedAtMs = Date.now();
    const response = await fetch(snsPlannerPostDraftsUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Trace-Id": traceId,
        "X-Correlation-Id": correlationId,
        "X-Source-App": postDraftTestPayload.sourceApp
      },
      body: JSON.stringify(postDraftTestPayload),
      cache: "no-store"
    });
    const responseText = await response.text();
    let responseBody: SnsPlannerResponse | { raw: string };

    try {
      responseBody = JSON.parse(responseText) as SnsPlannerResponse;
    } catch {
      responseBody = { raw: responseText };
    }

    const maybeDraft = responseBody as SnsPlannerResponse;
    const recordedDraft = {
      draftId: asString(maybeDraft.draftId) ?? asString(maybeDraft.id),
      workspaceId:
        asString(maybeDraft.workspaceId) ?? postDraftTestPayload.workspaceId,
      status: asString(maybeDraft.status),
      channel: asString(maybeDraft.channel) ?? postDraftTestPayload.channel
    };
    const errorCode = getUpstreamErrorCode(response.status);
    const inboundApiLog = {
      logType: "api.inbound",
      traceId,
      correlationId,
      requestId,
      sourceApp: inboundSourceApp,
      targetApp: postDraftTestPayload.sourceApp,
      operation: "GrowthEngine.PostDraftTest",
      endpoint: "POST /api/integrations/sns-planner/post-draft-test",
      workspaceId: postDraftTestPayload.workspaceId,
      userId: postDraftTestPayload.userId,
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
      sourceApp: postDraftTestPayload.sourceApp,
      targetApp: "sns-planner",
      operation: "PostDraft.Generate",
      endpoint: "POST /api/post-drafts",
      workspaceId: postDraftTestPayload.workspaceId,
      userId: postDraftTestPayload.userId,
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
        status: response.ok ? "ok" : "error",
        integration: "sns-planner",
        endpoint: snsPlannerPostDraftsUrl,
        snsPlannerStatusCode: response.status,
        recordedDraft,
        traceId,
        correlationId,
        requestId,
        eventName: "sns.post_draft.created.v1",
        inboundApiLog,
        outboundApiLog,
        error: errorCode
          ? {
              code: errorCode,
              message: "SNS Planner returned an unexpected response.",
              retryable:
                errorCode === "UPSTREAM_TIMEOUT" ||
                errorCode === "UPSTREAM_UNAVAILABLE" ||
                errorCode === "UPSTREAM_BAD_RESPONSE" ||
                errorCode === "ENVIRONMENT_LIMITATION",
              sourceApp: postDraftTestPayload.sourceApp,
              targetApp: "sns-planner",
              traceId,
              correlationId
            }
          : null,
        snsPlannerResponse: responseBody,
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
      targetApp: postDraftTestPayload.sourceApp,
      operation: "GrowthEngine.PostDraftTest",
      endpoint: "POST /api/integrations/sns-planner/post-draft-test",
      workspaceId: postDraftTestPayload.workspaceId,
      userId: postDraftTestPayload.userId,
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
      sourceApp: postDraftTestPayload.sourceApp,
      targetApp: "sns-planner",
      operation: "PostDraft.Generate",
      endpoint: "POST /api/post-drafts",
      workspaceId: postDraftTestPayload.workspaceId,
      userId: postDraftTestPayload.userId,
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
        integration: "sns-planner",
        endpoint: snsPlannerPostDraftsUrl,
        snsPlannerStatusCode: null,
        recordedDraft: null,
        traceId,
        correlationId,
        requestId,
        eventName: "sns.post_draft.created.v1",
        inboundApiLog,
        outboundApiLog,
        error: {
          code: errorCode,
          message: "SNS Planner request failed.",
          retryable: errorCode !== "INTERNAL_ERROR",
          sourceApp: postDraftTestPayload.sourceApp,
          targetApp: "sns-planner",
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
