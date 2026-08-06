import { NextResponse } from "next/server";
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
};

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function POST() {
  const startedAt = getTimestamp();
  const response = await fetch(numeriaStudioSessionStartUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
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

  return NextResponse.json(
    {
      appName,
      status: response.ok ? "ok" : "error",
      integration: "numeria-studio",
      endpoint: numeriaStudioSessionStartUrl,
      requestPayload: sessionStartTestPayload,
      numeriaStudioStatusCode: response.status,
      recordedSession,
      numeriaStudioResponse: responseBody,
      startedAt,
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}
