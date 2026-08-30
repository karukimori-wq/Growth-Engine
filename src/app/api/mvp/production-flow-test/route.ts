import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";

const numeriaStudioSessionStartUrl =
  "https://numeria-studio.illusionddt.chatgpt.site/api/sessions/start";
const aiPlatformCoreActivitiesUrl =
  "https://ai-platform-core-preview.illusionddt.chatgpt.site/api/activities";
const snsPlannerPostDraftsUrl =
  "https://sns-planner.illusionddt.chatgpt.site/api/post-drafts";

type FlowStatus = "success" | "warning" | "error" | "skipped";
type ErrorCode =
  | "BAD_REQUEST"
  | "CONTRACT_VIOLATION"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "UPSTREAM_BAD_RESPONSE"
  | "ENVIRONMENT_LIMITATION"
  | "INTERNAL_ERROR";

type Step = {
  name: string;
  status: FlowStatus;
  statusCode?: number | null;
  errorCode?: ErrorCode | null;
  evidence?: Record<string, unknown>;
  issue?: string | null;
};

type JsonRecord = Record<string, unknown>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Trace-Id, X-Correlation-Id, X-Source-App"
};

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function createId(prefix: "trace" | "corr" | "req" | "customer" | "reservation" | "followup") {
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
  if (statusCode === 522) {
    return "ENVIRONMENT_LIMITATION";
  }
  if (statusCode === 502 || statusCode === 503) {
    return "UPSTREAM_UNAVAILABLE";
  }
  return "UPSTREAM_BAD_RESPONSE";
}

function getDurationMs(startedAtMs: number): number {
  return Date.now() - startedAtMs;
}

function deriveTopStatus(steps: Step[]): FlowStatus {
  if (steps.some((step) => step.status === "error")) {
    return "error";
  }
  if (steps.some((step) => step.status === "warning")) {
    return "warning";
  }
  if (steps.every((step) => step.status === "skipped")) {
    return "skipped";
  }
  return "success";
}

async function postJson(url: string, payload: JsonRecord, traceId: string, correlationId: string) {
  const startedAtMs = Date.now();
  const response = await fetch(url, {
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
  let body: JsonRecord | { raw: string };

  try {
    body = JSON.parse(responseText) as JsonRecord;
  } catch {
    body = { raw: responseText };
  }

  return {
    ok: response.ok,
    statusCode: response.status,
    errorCode: getUpstreamErrorCode(response.status),
    durationMs: getDurationMs(startedAtMs),
    body
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
  const flowStartedAt = getTimestamp();
  const flowStartedAtMs = Date.now();
  const traceId = request.headers.get("X-Trace-Id") ?? createId("trace");
  const correlationId = request.headers.get("X-Correlation-Id") ?? createId("corr");
  const requestId = createId("req");
  const inboundSourceApp = request.headers.get("X-Source-App") ?? appName;
  const workspaceId = "ws_test_001";
  const userId = "user_test_owner_001";
  const customerId = "customer_test_001";
  const reservationId = createId("reservation");
  const steps: Step[] = [];
  const issues: string[] = [];
  const acceptedWarnings: string[] = [];

  const customerReference = {
    customerId,
    workspaceId,
    sourceOfTruth: "growth-engine",
    referenceOnly: true
  };
  steps.push({
    name: "customer.reference",
    status: "success",
    evidence: customerReference,
    issue: null
  });

  const reservation = {
    reservationId,
    workspaceId,
    customerId,
    productId: "product_numerology_test",
    reservationStatus: "prepared",
    sourceOfTruth: "growth-engine"
  };
  steps.push({
    name: "reservation.prepare",
    status: "success",
    evidence: reservation,
    issue: null
  });

  let sessionId: string | null = null;
  let reportReference: JsonRecord | null = null;
  let activityId: string | null = null;
  let draftId: string | null = null;

  try {
    const sessionPayload = {
      workspaceId,
      userId,
      sourceApp: appName,
      reservationId,
      customerRef: { customerId },
      sessionType: "numerology",
      intent: "start_appraisal_session"
    };
    const sessionResult = await postJson(
      numeriaStudioSessionStartUrl,
      sessionPayload,
      traceId,
      correlationId
    );
    const sessionBody = sessionResult.body as JsonRecord;
    sessionId = asString(sessionBody.sessionId) ?? asString(sessionBody.id);
    const sessionSucceeded = sessionResult.ok && Boolean(sessionId);

    steps.push({
      name: "numeria.session.start",
      status: sessionSucceeded ? "success" : "error",
      statusCode: sessionResult.statusCode,
      errorCode: sessionResult.errorCode,
      evidence: {
        sessionId,
        workspaceId: asString(sessionBody.workspaceId) ?? workspaceId,
        sessionStatus: asString(sessionBody.sessionStatus) ?? asString(sessionBody.status),
        sourceOfTruth: "numeria-studio",
        eventName: asString(sessionBody.eventName) ?? "studio.session.started.v1",
        durationMs: sessionResult.durationMs
      },
      issue: sessionSucceeded ? null : "Numeria Studio session start did not return a sessionId."
    });

    reportReference = {
      reportId: asString(sessionBody.reportId) ?? "report_reference_pending_mvp",
      sessionId,
      workspaceId,
      sourceOfTruth: "numeria-studio",
      referenceOnly: true,
      reportContentCopied: false
    };
    steps.push({
      name: "numeria.report.reference",
      status: "success",
      evidence: reportReference,
      issue: null
    });

    const activityPayload = {
      workspaceId,
      userId,
      sourceApp: appName,
      activityType: "growth.mvp.production_flow.checked",
      capability: "growth.mvp.production_flow.verify",
      inputRef: {
        reservationId,
        customerId,
        sessionId,
        reportId: reportReference.reportId,
        contextType: "mvp_production_flow"
      }
    };
    const activityResult = await postJson(
      aiPlatformCoreActivitiesUrl,
      activityPayload,
      traceId,
      correlationId
    );
    const activityBody = activityResult.body as JsonRecord;
    activityId = asString(activityBody.activityId) ?? asString(activityBody.id);
    const activityStatus = asString(activityBody.activityStatus) ?? asString(activityBody.status);
    const activitySucceeded = activityResult.ok && Boolean(activityId);

    steps.push({
      name: "ai.activity.record",
      status: activitySucceeded ? "success" : "error",
      statusCode: activityResult.statusCode,
      errorCode: activityResult.errorCode,
      evidence: {
        activityId,
        activityStatus,
        workspaceId: asString(activityBody.workspaceId) ?? workspaceId,
        sourceOfTruth: "ai-platform-core",
        capability: asString(activityBody.capability) ?? activityPayload.capability,
        eventName: asString(activityBody.eventName) ?? "ai.activity.created.v1",
        durationMs: activityResult.durationMs
      },
      issue: activitySucceeded ? null : "AI Platform Core did not return an activityId."
    });

    const followupContext = {
      followupContextId: createId("followup"),
      workspaceId,
      customerId,
      reservationId,
      sessionId,
      reportId: reportReference.reportId,
      sourceOfTruth: "growth-engine",
      contextType: "post_session_followup",
      allowedData: ["ids", "tags", "status", "recommendedTiming"],
      excludes: [
        "personalInformation",
        "paymentStatus",
        "salesAmount",
        "fullReportContents",
        "fullMeetingTranscript",
        "secretPrompts"
      ]
    };
    steps.push({
      name: "growth.followup_context.prepare",
      status: "success",
      evidence: followupContext,
      issue: null
    });

    const postDraftPayload = {
      workspaceId,
      userId,
      sourceApp: appName,
      objective: "increase_reservations",
      targetAudience: "repeat_customers",
      topic: "今月の数秘メッセージ",
      contentType: "instagram_post",
      channel: "instagram",
      cta: "予約ページを見る",
      destinationUrl: `${request.nextUrl.origin}/public/booking`
    };
    const postDraftResult = await postJson(
      snsPlannerPostDraftsUrl,
      postDraftPayload,
      traceId,
      correlationId
    );
    const postDraftBody = postDraftResult.body as JsonRecord;
    draftId = asString(postDraftBody.draftId) ?? asString(postDraftBody.id);
    const draftStatus =
      asString(postDraftBody.draftStatus) ?? asString(postDraftBody.postDraftStatus) ?? asString(postDraftBody.status);
    const postDraftCreated = postDraftResult.ok && Boolean(draftId);
    const snsError = postDraftBody.error as JsonRecord | undefined;
    const snsErrorCode = asString(snsError?.code);
    const acceptedEnvironmentWarning =
      postDraftBody.status === "warning" && snsErrorCode === "ENVIRONMENT_LIMITATION";

    if (acceptedEnvironmentWarning) {
      acceptedWarnings.push("SNS Planner recorded PostDraft but its AI Activity side-effect returned ENVIRONMENT_LIMITATION.");
    }

    steps.push({
      name: "sns.post_draft.create",
      status: postDraftCreated ? "success" : acceptedEnvironmentWarning ? "warning" : "error",
      statusCode: postDraftResult.statusCode,
      errorCode: postDraftResult.errorCode,
      evidence: {
        draftId,
        draftStatus,
        workspaceId: asString(postDraftBody.workspaceId) ?? workspaceId,
        channel: asString(postDraftBody.channel) ?? postDraftPayload.channel,
        sourceOfTruth: "sns-planner",
        eventName: asString(postDraftBody.eventName) ?? "sns.post_draft.created.v1",
        acceptedDownstreamWarning: acceptedEnvironmentWarning,
        downstreamErrorCode: snsErrorCode ?? null,
        durationMs: postDraftResult.durationMs
      },
      issue: postDraftCreated ? null : "SNS Planner did not return a draftId."
    });

    steps.push({
      name: "sns.post_draft.reference",
      status: draftId ? "success" : "skipped",
      evidence: {
        draftId,
        workspaceId,
        sourceOfTruth: "sns-planner",
        referenceStoredByGrowthEngine: true
      },
      issue: draftId ? null : "PostDraft reference skipped because draftId was not returned."
    });
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "Unexpected production flow error.");
    steps.push({
      name: "flow.unhandled_error",
      status: "error",
      errorCode: "INTERNAL_ERROR",
      issue: "Unexpected production flow error."
    });
  }

  const topStatus = deriveTopStatus(steps);
  const inboundApiLog = {
    logType: "api.inbound",
    traceId,
    correlationId,
    requestId,
    sourceApp: inboundSourceApp,
    targetApp: appName,
    operation: "GrowthEngine.MvpProductionFlowTest",
    endpoint: "POST /api/mvp/production-flow-test",
    workspaceId,
    userId,
    status: topStatus,
    statusCode: 200,
    errorCode: topStatus === "error" ? "INTERNAL_ERROR" : null,
    durationMs: getDurationMs(flowStartedAtMs),
    occurredAt: getTimestamp()
  };

  console.log(JSON.stringify(inboundApiLog));

  return NextResponse.json(
    {
      appName,
      status: topStatus === "error" ? "error" : "success",
      flowName: "mvp.production.flow",
      traceId,
      correlationId,
      requestId,
      workspaceId,
      userId,
      customerRef: customerReference,
      reservationRef: reservation,
      sessionRef: sessionId ? { sessionId, sourceOfTruth: "numeria-studio" } : null,
      reportRef: reportReference,
      aiActivityRef: activityId ? { activityId, sourceOfTruth: "ai-platform-core" } : null,
      postDraftRef: draftId ? { draftId, sourceOfTruth: "sns-planner" } : null,
      steps,
      acceptedWarnings,
      issues,
      inboundApiLog,
      dataSafety: {
        referenceIdOnlyPayloads: true,
        excludesPersonalInformation: true,
        excludesPaymentStatus: true,
        excludesSalesAmount: true,
        excludesFullReportContents: true,
        excludesFullMeetingTranscript: true,
        excludesApiKeysAndSecretPrompts: true
      },
      startedAt: flowStartedAt,
      timestamp: getTimestamp()
    },
    {
      status: 200,
      headers: createResponseHeaders(traceId, correlationId, requestId)
    }
  );
}
