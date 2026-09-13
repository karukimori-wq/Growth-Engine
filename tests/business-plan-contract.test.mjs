import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  evaluateProfessionalReturnPayload,
  growthEngineSourceOfTruth,
  professionalReturnAllowedFields,
  professionalReturnForbiddenFields,
} from "../src/domain/business-boundary.ts";
import {
  businessPlanContract,
  canUseBusinessIntegration,
  isBusinessPublicEntryVisible,
  isBusinessPurchasableByNormalUser,
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

test("Business integration is unavailable until every future gate passes", () => {
  assert.equal(businessPlanContract.businessAvailabilityStatus, "unavailable");
  assert.equal(businessPlanContract.businessOfferingStatus, "unavailable");
  assert.equal(businessPlanContract.featureFlagKey, "business.cross_app.flow");
  assert.equal(businessPlanContract.featureFlagDefault, false);
  assert.equal(businessPlanContract.publicEntryVisibleWhileUnavailable, false);
  assert.equal(businessPlanContract.publicEntryVisibleWhileNotOffered, false);
  assert.equal(businessPlanContract.normalUserPurchaseVisible, false);
  assert.equal(businessPlanContract.failClosed, true);

  assert.equal(isBusinessPublicEntryVisible("unavailable"), false);
  assert.equal(isBusinessPublicEntryVisible("preparing"), false);
  assert.equal(isBusinessPublicEntryVisible("available"), true);
  assert.equal(isBusinessPurchasableByNormalUser("unavailable"), false);
  assert.equal(isBusinessPurchasableByNormalUser("preparing"), false);
  assert.equal(isBusinessPurchasableByNormalUser("available"), true);

  for (const planId of supportedPlanIds) {
    assert.equal(canUseBusinessIntegration({
      planId,
      availabilityStatus: "unavailable",
      featureEnabled: false,
    }), false);
    assert.equal(canUseBusinessIntegration({
      planId,
      availabilityStatus: "preparing",
      featureEnabled: true,
    }), false);
  }

  assert.equal(canUseBusinessIntegration({
    planId: "pro",
    availabilityStatus: "available",
    featureEnabled: true,
  }), false);
  assert.equal(canUseBusinessIntegration({
    planId: "business",
    availabilityStatus: "available",
    featureEnabled: false,
  }), false);
  assert.equal(canUseBusinessIntegration({
    planId: "business",
    availabilityStatus: "available",
    featureEnabled: true,
  }), true);
});

test("Growth Engine publishes its Business source-of-truth and Professional return boundary", () => {
  assert.deepEqual([...growthEngineSourceOfTruth], [
    "Customer",
    "Reservation",
    "Payment",
    "Sales",
    "Public Site",
    "Business plan workflow",
  ]);
  assert.deepEqual([...professionalReturnAllowedFields], [
    "workspaceId",
    "userId",
    "customerId",
    "reservationId",
    "sessionId",
    "reportId",
    "reportRef",
    "status",
    "completedAt",
    "sourceApp",
    "correlationId",
  ]);
  assert.ok(professionalReturnForbiddenFields.includes("fullReportText"));
  assert.ok(professionalReturnForbiddenFields.includes("fullConversationText"));
  assert.ok(professionalReturnForbiddenFields.includes("paymentDetails"));
  assert.ok(professionalReturnForbiddenFields.includes("salesDetails"));
  assert.ok(professionalReturnForbiddenFields.includes("fullCustomerMaster"));
  assert.ok(professionalReturnForbiddenFields.includes("stripePaymentIntentId"));
  assert.ok(professionalReturnForbiddenFields.includes("secret"));
});

test("Professional return payload evaluation accepts only contracted reference fields", () => {
  assert.deepEqual(evaluateProfessionalReturnPayload({
    workspaceId: "ws_1",
    userId: "user_1",
    customerId: "cus_1",
    reservationId: "res_1",
    sessionId: "session_1",
    reportId: "report_1",
    reportRef: "report:report_1",
    status: "completed",
    completedAt: "2026-09-12T00:00:00.000Z",
    sourceApp: "numeria-studio",
    correlationId: "corr_1",
  }).ok, true);

  const result = evaluateProfessionalReturnPayload({
    workspaceId: "ws_1",
    fullReportText: "must not cross the boundary",
    paymentDetails: { amount: 1000 },
    customerMaster: { displayName: "full record must not be returned" },
    unexpectedField: true,
  });

  assert.deepEqual(result.rejectedFields, ["fullReportText", "paymentDetails", "customerMaster"]);
  assert.deepEqual(result.unknownFields, ["unexpectedField"]);
  assert.equal(result.ok, false);
});

test("/contracts/status source exposes Business unavailable state and Growth Engine boundary metadata", () => {
  const metadataSource = readRepositoryFile("src/server/app-metadata.ts");

  assert.match(metadataSource, /businessAvailabilityStatus/);
  assert.match(metadataSource, /normalUserBusinessPurchaseVisible/);
  assert.match(metadataSource, /publicBusinessEntryVisibleWhileUnavailable/);
  assert.match(metadataSource, /growthEngineSourceOfTruth/);
  assert.match(metadataSource, /professionalReturnAllowedFields/);
  assert.match(metadataSource, /professionalReturnForbiddenFields/);
  assert.match(metadataSource, /paymentAndSalesCanonicalOwner:\s*"growth-engine"/);
});

test("Platform Admin readiness endpoints expose contract-safe monitoring surfaces", () => {
  const releaseStatusSource = readRepositoryFile("src/app/release/status/route.ts");
  const authStatusSource = readRepositoryFile("src/app/auth/status/route.ts");
  const publicPersistenceSource = readRepositoryFile("src/app/persistence/status/route.ts");
  const apiPersistenceSource = readRepositoryFile("src/app/api/persistence/status/route.ts");
  const sharedPersistenceSource = readRepositoryFile("src/server/persistence-status.ts");

  assert.match(releaseStatusSource, /releaseScope:\s*"free-pro-support-boundary"/);
  assert.match(releaseStatusSource, /free:\s*"ready"/);
  assert.match(releaseStatusSource, /pro:\s*"ready"/);
  assert.match(releaseStatusSource, /business:\s*businessPlanContract\.businessAvailabilityStatus/);
  assert.match(releaseStatusSource, /businessPurchasable:\s*false/);
  assert.match(releaseStatusSource, /businessPublicEntryVisible:\s*false/);
  assert.match(releaseStatusSource, /professional-platform-contracts\/docs\/contracts\/plan-contract\.md/);

  assert.match(authStatusSource, /isProductionAuthConfigured\(\)/);
  assert.match(authStatusSource, /authMode:\s*"signed-owner-session"/);
  assert.match(authStatusSource, /activeUserRequired:\s*true/);
  assert.match(authStatusSource, /businessPlanRequiredForOwnerBusinessApis:\s*true/);
  assert.match(authStatusSource, /secretValuesExposed:\s*false/);

  assert.match(publicPersistenceSource, /getPersistenceStatus\(\)/);
  assert.match(apiPersistenceSource, /getPersistenceStatus\(\)/);
  assert.match(sharedPersistenceSource, /databaseBackedPersistenceReady/);
  assert.match(sharedPersistenceSource, /d1Reachable/);
  assert.match(sharedPersistenceSource, /envValuesExposed:\s*false/);
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
