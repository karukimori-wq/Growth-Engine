import { NextResponse } from "next/server";
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
};

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function POST() {
  const startedAt = getTimestamp();
  const response = await fetch(aiPlatformCoreActivitiesUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
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

  return NextResponse.json(
    {
      appName,
      status: response.ok ? "ok" : "error",
      integration: "ai-platform-core",
      endpoint: aiPlatformCoreActivitiesUrl,
      requestPayload: activityTestPayload,
      aiPlatformCoreStatusCode: response.status,
      recordedActivity,
      aiPlatformCoreResponse: responseBody,
      startedAt,
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}
