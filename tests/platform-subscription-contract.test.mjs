import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync("cloudflare/schema.sql", "utf8");
const repository = readFileSync("src/server/platform-subscriptions.ts", "utf8");
const entitlementRoute = readFileSync("app/api/subscriptions/entitlement/route.ts", "utf8");
const statusRoute = readFileSync("app/api/subscriptions/status/route.ts", "utf8");

test("platform subscription D1 projection is separate from customer payment records", () => {
  assert.match(schema, /CREATE TABLE IF NOT EXISTS platform_subscriptions/);
  assert.match(schema, /product_code TEXT NOT NULL CHECK \(product_code IN \('numeria-studio', 'velvet'\)\)/);
  assert.match(schema, /plan_id TEXT NOT NULL CHECK \(plan_id IN \('free', 'pro'\)\)/);
  assert.doesNotMatch(schema.match(/CREATE TABLE IF NOT EXISTS platform_subscriptions[\s\S]*?;\n/)?.[0] ?? "", /sales_amount|card_number|payment_details/i);
});

test("entitlement API defaults invalid or missing paid state to Free", () => {
  assert.match(repository, /planId: "free"/);
  assert.match(repository, /planId === "pro"/);
  assert.match(repository, /subscriptionStatus === "active" \|\| subscriptionStatus === "trialing"/);
  assert.match(repository, /entitlementStatus === "active"/);
  assert.match(repository, /return \{\n      \.\.\.defaultFreeEntitlement/);
});

test("subscription endpoint requires server integration secret and returns no payment details", () => {
  assert.match(repository, /PLATFORM_SUBSCRIPTION_INTEGRATION_SECRET/);
  assert.match(entitlementRoute, /isAuthorizedPlatformSubscriptionRequest/);
  assert.match(entitlementRoute, /paymentDetailsReturned: false/);
  assert.match(entitlementRoute, /stripeObjectReturned: false/);
  assert.match(entitlementRoute, /secretValuesExposed: false/);
  assert.doesNotMatch(entitlementRoute, /STRIPE_SECRET_KEY/);
});

test("status separates entitlement readiness from Stripe checkout readiness", () => {
  assert.match(statusRoute, /platform-saas-subscription\.v1/);
  assert.match(statusRoute, /businessPurchasable: false/);
  assert.match(repository, /entitlementReadReady/);
  assert.match(repository, /checkoutReady/);
  assert.match(repository, /NUMERIA_PRO_STRIPE_PRICE_ID/);
  assert.match(repository, /VELVET_PRO_STRIPE_PRICE_ID/);
  assert.match(repository, /secretValuesExposed: false/);
});
