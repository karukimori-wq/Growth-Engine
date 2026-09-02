import assert from "node:assert/strict";
import test from "node:test";
import {
  businessPlanContract,
  canUseBusinessIntegration,
  isSharedPlanId,
  supportedPlanIds,
} from "../src/domain/plan-contract.ts";

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
