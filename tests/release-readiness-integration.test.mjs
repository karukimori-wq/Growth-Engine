import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(`${repositoryRoot}${path}`, "utf8");

test("AI Platform Core integration uses the configurable current endpoint", () => {
  const routeSource = read("src/app/api/integrations/ai-platform-core/activity-test/route.ts");
  const envExample = read(".env.example");
  const wranglerConfig = read("wrangler.jsonc");

  assert.match(routeSource, /process\.env\.AI_PLATFORM_CORE_URL/);
  assert.match(routeSource, /https:\/\/ai-platform-core\.karukimori\.workers\.dev/);
  assert.doesNotMatch(routeSource, /ai-platform-core-preview\.illusionddt\.chatgpt\.site/);
  assert.match(envExample, /AI_PLATFORM_CORE_URL=https:\/\/ai-platform-core\.karukimori\.workers\.dev/);
  assert.match(wranglerConfig, /"AI_PLATFORM_CORE_URL":\s*"https:\/\/ai-platform-core\.karukimori\.workers\.dev"/);
});

test("release status exposes Platform Admin monitoring metadata without claiming Business availability", () => {
  const releaseStatusSource = read("src/app/release/status/route.ts");

  assert.match(releaseStatusSource, /entitlementReadiness:\s*"compliant"/);
  assert.match(releaseStatusSource, /usageReadiness:\s*"not_applicable"/);
  assert.match(releaseStatusSource, /aiPlatformCoreIntegration/);
  assert.match(releaseStatusSource, /feedbackHubEntry/);
  assert.match(releaseStatusSource, /latestDeploy/);
  assert.match(releaseStatusSource, /primaryErrorCategories/);
  assert.match(releaseStatusSource, /businessPurchasable:\s*false/);
  assert.match(releaseStatusSource, /businessPublicEntryVisible:\s*false/);
});
