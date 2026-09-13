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
