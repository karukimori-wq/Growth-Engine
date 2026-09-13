import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(`${repositoryRoot}${path}`, "utf8");

test("future Business cross-app flow is explicitly fail-closed in runtime configuration", () => {
  const guardSource = read("src/server/business-integration-access.ts");
  const wranglerConfig = read("wrangler.jsonc");
  const envExample = read(".env.example");

  assert.match(guardSource, /BUSINESS_CROSS_APP_FLOW_ENABLED/);
  assert.match(guardSource, /value === "true"/);
  assert.match(guardSource, /businessPlanContract\.businessAvailabilityStatus/);
  assert.match(guardSource, /canUseBusinessIntegration/);
  assert.match(guardSource, /requireActiveUser\(context\)/);
  assert.match(guardSource, /Business cross-app integration is unavailable/);
  assert.match(wranglerConfig, /"BUSINESS_CROSS_APP_FLOW_ENABLED":\s*"false"/);
  assert.match(envExample, /BUSINESS_CROSS_APP_FLOW_ENABLED=false/);
});

test("future Business integration API resolver is separate from the internal owner pilot resolver", () => {
  const apiSource = read("src/server/api.ts");

  assert.match(apiSource, /resolveBusinessApiContext/);
  assert.match(apiSource, /resolveFutureBusinessIntegrationApiContext/);
  assert.match(apiSource, /requireFutureBusinessIntegrationAccess\(context\)/);
  assert.match(apiSource, /requireWorkspaceAccess\(context, workspaceId\)/);
});

test("release monitoring and Production smoke keep the future Business flag disabled", () => {
  const releaseStatusSource = read("src/app/release/status/route.ts");
  const workflowSource = read(".github/workflows/cloudflare-production.yml");

  assert.match(releaseStatusSource, /businessFeatureFlagEnabled/);
  assert.match(releaseStatusSource, /businessIntegrationGate/);
  assert.match(releaseStatusSource, /requiredAvailabilityStatus:\s*"available"/);
  assert.match(releaseStatusSource, /failClosed:\s*businessPlanContract\.failClosed/);
  assert.match(workflowSource, /releaseStatus\.businessFeatureFlagEnabled!==false/);
  assert.match(workflowSource, /businessIntegrationGate\?\.featureFlagEnabled!==false/);
  assert.match(workflowSource, /businessIntegrationGate\?\.failClosed!==true/);
});

test("Professional public surfaces do not expose Business navigation while unavailable", () => {
  const appRootSource = read("src/app/app/page.tsx");
  const professionalHomeSource = read("src/app/app/professional/[studioKey]/page.tsx");
  const professionalSectionSource = read("src/app/app/professional/[studioKey]/[...section]/page.tsx");

  assert.doesNotMatch(appRootSource, /Business共通機能/);
  assert.match(appRootSource, /Growth Engineは共通基盤を持ち/);

  assert.match(professionalHomeSource, /isBusinessPublicEntryVisible/);
  assert.match(professionalHomeSource, /showBusinessEntry/);

  assert.match(professionalSectionSource, /businessPlanContract\.businessAvailabilityStatus/);
  assert.match(professionalSectionSource, /isBusinessPublicEntryVisible/);
  assert.match(professionalSectionSource, /isCustomerReference && showBusinessEntry/);
  assert.match(professionalSectionSource, /showBusinessEntry \? \(/);
  assert.match(professionalSectionSource, /href="\/app\/business"/);
});

test("Business UI direct routes stay behind the signed owner-session middleware", () => {
  const middlewareSource = read("src/middleware.ts");
  const signInPageSource = read("src/app/app/sign-in/page.tsx");
  const signInRouteSource = read("src/app/api/auth/sign-in/route.ts");

  assert.match(middlewareSource, /pathname\.startsWith\("\/app\/business"\)/);
  assert.match(middlewareSource, /verifySessionToken/);
  assert.match(middlewareSource, /authSessionCookieName/);
  assert.match(middlewareSource, /pathname = "\/app\/sign-in"/);
  assert.match(middlewareSource, /"\/app\/business\/:path\*"/);

  assert.match(signInPageSource, /params\.next\?\.startsWith\("\/app\/business"\)/);
  assert.match(signInRouteSource, /nextValue\.startsWith\("\/app\/business"\)/);
  assert.match(signInRouteSource, /isValidOwnerAccessCode/);
  assert.match(signInRouteSource, /createOwnerSessionToken/);
  assert.match(signInRouteSource, /httpOnly:\s*true/);
  assert.match(signInRouteSource, /sameSite:\s*"lax"/);
  assert.match(signInRouteSource, /secure:\s*true/);
});

test("operational integration test APIs require the signed owner session", () => {
  const middlewareSource = read("src/middleware.ts");
  const releaseStatusSource = read("src/app/release/status/route.ts");
  const workflowSource = read(".github/workflows/cloudflare-production.yml");
  const protectedTestPaths = [
    "/api/integrations/ai-platform-core/activity-test",
    "/api/integrations/communication-planner/handoff-test",
    "/api/integrations/numeria-studio/session-start-test",
    "/api/integrations/sns-planner/message-draft-test",
    "/api/integrations/sns-planner/post-draft-test",
    "/api/integrations/velvet/handoff-test",
    "/api/integrations/velvet/visit-start-test",
  ];

  for (const path of protectedTestPaths) {
    assert.ok(middlewareSource.includes(`"${path}"`), `${path} must be protected by middleware`);
  }

  assert.match(middlewareSource, /isOperationalTestApi/);
  assert.match(middlewareSource, /Authenticated owner session is required/);
  assert.match(middlewareSource, /status:\s*401/);
  assert.match(middlewareSource, /"\/api\/integrations\/:path\*"/);

  assert.match(releaseStatusSource, /operationalTestAccess/);
  assert.match(releaseStatusSource, /mode:\s*"signed-owner-session"/);
  assert.match(releaseStatusSource, /public:\s*false/);
  assert.match(releaseStatusSource, /activityTestAccess:\s*"signed-owner-session"/);

  assert.match(workflowSource, /OPERATIONAL_TEST_STATUS/);
  assert.match(workflowSource, /ai-platform-core\/activity-test/);
  assert.match(workflowSource, /OPERATIONAL_TEST_STATUS" != "401"/);
  assert.match(workflowSource, /operationalTestAccess\?\.public!==false/);
});
