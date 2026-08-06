import { NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";

const snsPlannerPostDraftsUrl =
  "https://sns-planner.illusionddt.chatgpt.site/api/post-drafts";

const snsPlannerTestPayload = {
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
  status?: unknown;
  workspaceId?: unknown;
  channel?: unknown;
};

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function POST() {
  const startedAt = getTimestamp();
  const response = await fetch(snsPlannerPostDraftsUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(snsPlannerTestPayload),
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
    status: asString(maybeDraft.status),
    workspaceId:
      asString(maybeDraft.workspaceId) ?? snsPlannerTestPayload.workspaceId,
    channel: asString(maybeDraft.channel) ?? snsPlannerTestPayload.channel
  };

  return NextResponse.json(
    {
      appName,
      status: response.ok ? "ok" : "error",
      integration: "sns-planner",
      endpoint: snsPlannerPostDraftsUrl,
      requestPayload: snsPlannerTestPayload,
      snsPlannerStatusCode: response.status,
      recordedDraft,
      snsPlannerResponse: responseBody,
      startedAt,
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}
