import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const screenFlow = await readFile(new URL("../src/lib/screen-flow.ts", import.meta.url), "utf8");
const reservationDetailPage = await readFile(
  new URL("../src/app/app/business/reservations/[reservationId]/page.tsx", import.meta.url),
  "utf8"
);
const numeriaRoute = await readFile(
  new URL("../src/app/api/integrations/numeria-studio/session-start-test/route.ts", import.meta.url),
  "utf8"
);
const velvetRoute = await readFile(
  new URL("../src/app/api/integrations/velvet/visit-start-test/route.ts", import.meta.url),
  "utf8"
);
const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");

test("Numeria handoff and integration check use configurable server-side base URL", () => {
  assert.match(screenFlow, /process\.env\.NUMERIA_STUDIO_BASE_URL/);
  assert.match(numeriaRoute, /process\.env\.NUMERIA_STUDIO_BASE_URL/);
  assert.match(screenFlow, /\/app\/growth\/start/);
  assert.match(numeriaRoute, /\/api\/sessions\/start/);

  assert.doesNotMatch(reservationDetailPage, /^\s*["']use client["'];?/m);
  assert.match(
    reservationDetailPage,
    /import\s*\{[^}]*createNumeriaStartUrl[^}]*\}\s*from\s*["']@\/lib\/screen-flow["']/s
  );
  assert.match(reservationDetailPage, /createNumeriaStartUrl\s*\(/);
});

test("Numeria handoff keeps Growth Engine-owned business data out of the URL", () => {
  const functionStart = screenFlow.indexOf("export function createNumeriaStartUrl");
  const functionEnd = screenFlow.indexOf("export function createPostDraftBriefUrl", functionStart);
  const numeriaHandoff = screenFlow.slice(functionStart, functionEnd);

  assert.match(numeriaHandoff, /workspaceId/);
  assert.match(numeriaHandoff, /userId/);
  assert.match(numeriaHandoff, /reservationId/);
  assert.match(numeriaHandoff, /customerId/);
  assert.match(numeriaHandoff, /start_appraisal_session/);
  assert.doesNotMatch(numeriaHandoff, /paymentStatus|salesAmount|stripe|reportBody|transcript|apiKey|secretPrompt/i);
});

test("Velvet integration remains configurable and does not send Growth Engine-owned sensitive business data", () => {
  assert.match(velvetRoute, /process\.env\.VELVET_BASE_URL/);
  assert.match(velvetRoute, /customerMasterSent\s*:\s*false/);
  assert.match(velvetRoute, /paymentStatusSent\s*:\s*false/);
  assert.match(velvetRoute, /salesAmountSent\s*:\s*false/);
  assert.match(velvetRoute, /stripeDataSent\s*:\s*false/);
});

test("professional app endpoint variables are documented without secret values", () => {
  assert.match(envExample, /NUMERIA_STUDIO_BASE_URL=/);
  assert.match(envExample, /VELVET_BASE_URL=/);
  assert.match(envExample, /SNS_PLANNER_BASE_URL=/);
  assert.doesNotMatch(envExample, /VELVET_INTEGRATION_SECRET=[^\n]*[A-Za-z0-9]{20,}/);
});
