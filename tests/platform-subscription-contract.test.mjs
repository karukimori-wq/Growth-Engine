import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const schema = readFileSync("cloudflare/schema.sql", "utf8");
const repository = readFileSync("src/server/platform-subscriptions.ts", "utf8");
const stripeRuntime = readFileSync("src/server/platform-subscription-stripe.ts", "utf8");
const entitlementRoute = readFileSync("src/app/api/subscriptions/entitlement/route.ts", "utf8");
const statusRoute = readFileSync("src/app/api/subscriptions/status/route.ts", "utf8");
const checkoutRoute = readFileSync("src/app/api/subscriptions/checkout/route.ts", "utf8");
const webhookRoute = readFileSync("src/app/api/subscriptions/webhook/route.ts", "utf8");

test("Growth Engine keeps Next.js application routes under src/app only", () => {
  assert.equal(existsSync("app"), false, "Do not create a root app directory; it overrides the canonical src/app tree and removes existing Production routes.");
  for (const path of [
    "src/app/api/subscriptions/entitlement/route.ts",
    "src/app/api/subscriptions/status/route.ts",
    "src/app/api/subscriptions/checkout/route.ts",
    "src/app/api/subscriptions/webhook/route.ts",
  ]) assert.equal(existsSync(path), true, `${path} must exist under src/app.`);
});

test("platform subscription D1 projection is separate from customer payment records", () => {
  assert.match(schema, /CREATE TABLE IF NOT EXISTS platform_subscriptions/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS platform_subscription_webhook_events/);
  assert.match(schema, /product_code TEXT NOT NULL CHECK \(product_code IN \('numeria-studio', 'velvet'\)\)/);
  assert.match(schema, /plan_id TEXT NOT NULL CHECK \(plan_id IN \('free', 'pro'\)\)/);
  const subscriptionTable = schema.match(/CREATE TABLE IF NOT EXISTS platform_subscriptions[\s\S]*?;\n/)?.[0] ?? "";
  assert.doesNotMatch(subscriptionTable, /sales_amount|card_number|payment_details/i);
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

test("SaaS checkout is hosted Stripe subscription checkout and is isolated from customer payment records", () => {
  assert.match(checkoutRoute, /isAuthorizedPlatformSubscriptionRequest/);
  assert.match(checkoutRoute, /createPlatformSubscriptionCheckout/);
  assert.match(stripeRuntime, /mode", "subscription"/);
  assert.match(stripeRuntime, /NUMERIA_PRO_STRIPE_PRICE_ID/);
  assert.match(stripeRuntime, /subscription_data\[metadata\]/);
  assert.match(stripeRuntime, /hostedCheckoutOnly: true/);
  assert.match(stripeRuntime, /customerPaymentLedgerTouched: false/);
  assert.doesNotMatch(stripeRuntime, /createPayment|createRevenue|updateReservationPaymentStatus|findCustomer|findProduct/);
});

test("SaaS webhook uses a dedicated secret, idempotency table, and only updates subscription entitlement", () => {
  assert.match(webhookRoute, /applyPlatformSubscriptionStripeWebhook/);
  assert.match(stripeRuntime, /process\.env\.PLATFORM_SUBSCRIPTION_STRIPE_WEBHOOK_SECRET/);
  assert.match(stripeRuntime, /platform_subscription_webhook_events/);
  assert.match(stripeRuntime, /checkout\.session\.completed/);
  assert.match(stripeRuntime, /customer\.subscription\.updated/);
  assert.match(stripeRuntime, /customer\.subscription\.deleted/);
  assert.match(stripeRuntime, /upsertPlatformSubscriptionEntitlement/);
  assert.match(stripeRuntime, /verifyPlatformSubscriptionStripeSignature/);
  assert.doesNotMatch(stripeRuntime, /process\.env\.STRIPE_WEBHOOK_SECRET\b/);
  assert.doesNotMatch(stripeRuntime, /createPayment|createRevenue|updateReservationPaymentStatus/);
});

test("status separates entitlement readiness from complete Stripe checkout readiness", () => {
  assert.match(statusRoute, /platform-saas-subscription\.v1/);
  assert.match(statusRoute, /businessPurchasable: false/);
  assert.match(repository, /entitlementReadReady/);
  assert.match(repository, /checkoutImplementationReady/);
  assert.match(repository, /checkoutReady/);
  assert.match(repository, /PLATFORM_SUBSCRIPTION_STRIPE_WEBHOOK_SECRET/);
  assert.match(repository, /NUMERIA_PRO_STRIPE_PRICE_ID/);
  assert.match(repository, /VELVET_PRO_STRIPE_PRICE_ID/);
  assert.match(repository, /secretValuesExposed: false/);
});
