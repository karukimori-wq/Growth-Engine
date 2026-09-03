import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  businessPlanContract,
  canUseBusinessIntegration,
  isBusinessPublicEntryVisible,
  isSharedPlanId,
  supportedPlanIds,
} from "../src/domain/plan-contract.ts";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));

function readRepositoryFile(path) {
  return readFileSync(`${repositoryRoot}${path}`, "utf8");
}

test("Growth Engine recognizes the shared PlanId contract", () => {
  assert.deepEqual([...supportedPlanIds], ["free", "pro", "business"]);
  assert.equal(isSharedPlanId("free"), true);
  assert.equal(isSharedPlanId("pro"), true);
  assert.equal(isSharedPlanId("business"), true);
  assert.equal(isSharedPlanId("enterprise"), false);
});

test("Business integration is unavailable until every gate passes", () => {
  assert.equal(businessPlanContract.businessOfferingStatus, "not_offered");
  assert.equal(businessPlanContract.featureFlagKey, "business.cross_app.flow");
  assert.equal(businessPlanContract.featureFlagDefault, false);
  assert.equal(businessPlanContract.publicEntryVisibleWhileNotOffered, false);
  assert.equal(businessPlanContract.failClosed, true);
  assert.equal(isBusinessPublicEntryVisible("not_offered"), false);
  assert.equal(isBusinessPublicEntryVisible("available"), true);

  for (const planId of supportedPlanIds) {
    assert.equal(canUseBusinessIntegration({
      planId,
      offeringStatus: "not_offered",
      featureEnabled: false,
    }), false);
  }

  assert.equal(canUseBusinessIntegration({
    planId: "pro",
    offeringStatus: "available",
    featureEnabled: true,
  }), false);
  assert.equal(canUseBusinessIntegration({
    planId: "business",
    offeringStatus: "available",
    featureEnabled: false,
  }), false);
  assert.equal(canUseBusinessIntegration({
    planId: "business",
    offeringStatus: "available",
    featureEnabled: true,
  }), true);
});

test("owner Business APIs keep the shared fail-closed access resolver", () => {
  const resolverSource = readRepositoryFile("src/server/api.ts");

  assert.match(resolverSource, /requireActiveUser\(context\)/);
  assert.match(resolverSource, /requireBusinessAccess\(context\)/);
  assert.match(resolverSource, /requireWorkspaceAccess\(context, workspaceId\)/);

  const protectedRouteFiles = [
    "src/app/api/business/home/route.ts",
    "src/app/api/content-briefs/route.ts",
    "src/app/api/customers/[customerId]/route.ts",
    "src/app/api/customers/route.ts",
    "src/app/api/leads/[id]/convert/route.ts",
    "src/app/api/leads/route.ts",
    "src/app/api/payments/checkout/route.ts",
    "src/app/api/persistence/roundtrip/route.ts",
    "src/app/api/products/route.ts",
    "src/app/api/reservations/route.ts",
  ];

  for (const routeFile of protectedRouteFiles) {
    assert.match(
      readRepositoryFile(routeFile),
      /resolveBusinessApiContext\(request/,
      `${routeFile} must resolve the authenticated Business API context`,
    );
  }
});

test("the current internal Business API plan guard does not authorize Free or Pro", () => {
  const planGuardSource = readRepositoryFile("src/lib/plan.ts");

  assert.match(planGuardSource, /return plan === "business"/);
  assert.doesNotMatch(planGuardSource, /plan === "free"/);
  assert.doesNotMatch(planGuardSource, /plan === "pro"/);
});
