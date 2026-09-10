import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const screenFlow = await readFile(new URL("../src/lib/screen-flow.ts", import.meta.url), "utf8");
const numeriaRoute = await readFile(new URL("../src/app/api/integrations/numeria-studio/session-start-test/route.ts", import.meta.url), "utf8");
const velvetRoute = await readFile(new URL("../src/app/api/integrations/velvet/visit-start-test/route.ts", import.meta.url), "utf8");
const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");

test("Numeria handoff and integration check use configurable base URL", () => {
  assert.match(screenFlow, /process\.env\.NUMERIA_STUDIO_BASE_URL/);
  assert.match(numeriaRoute, /process\.env\.NUMERIA_STUDIO_BASE_URL/);
  assert.match(screenFlow, /\/app\/growth\/start/);
  assert.match(numeriaRoute, /\/api\/sessions\/start/);
});

test("Velvet integration remains configurable and does not send Growth Engine-owned sensitive business data", () => {
  assert.match(velvetRoute, /process\.env\.VELVET_BASE_URL/);
  assert.match(velvetRoute, /customerMasterSent:false/);
  assert.match(velvetRoute, /paymentStatusSent:false/);
  assert.match(velvetRoute, /salesAmountSent:false/);
  assert.match(velvetRoute, /stripeDataSent:false/);
});

test("professional app endpoint variables are documented without secret values", () => {
  assert.match(envExample, /NUMERIA_STUDIO_BASE_URL=/);
  assert.match(envExample, /VELVET_BASE_URL=/);
  assert.match(envExample, /SNS_PLANNER_BASE_URL=/);
  assert.doesNotMatch(envExample, /VELVET_INTEGRATION_SECRET=[^\n]*[A-Za-z0-9]{20,}/);
});
