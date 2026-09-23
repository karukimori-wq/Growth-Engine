import { createHmac, timingSafeEqual } from "node:crypto";

import {
  isPlatformSubscriptionProductCode,
  type PlatformSubscriptionProductCode,
  upsertPlatformSubscriptionEntitlement,
} from "@/server/platform-subscriptions";
import { getD1Database } from "@/server/d1-db";

const stripeApiBaseUrl = "https://api.stripe.com/v1";
const webhookToleranceSeconds = 300;

export type PlatformSubscriptionCheckoutInput = {
  workspaceId: string;
  ownerUserId: string;
  productCode: PlatformSubscriptionProductCode;
  successUrl: string;
  cancelUrl: string;
};

export type PlatformSubscriptionCheckoutResult = {
  checkoutRef: string;
  redirectUrl: string;
  productCode: PlatformSubscriptionProductCode;
  planId: "pro";
  paymentDetailsReturned: false;
  stripeObjectReturned: false;
};

type StripeCheckoutSession = {
  id?: string;
  url?: string | null;
  customer?: string | null;
  subscription?: string | null;
  metadata?: Record<string, string> | null;
};

type StripeSubscriptionObject = {
  id?: string;
  customer?: string | null;
  status?: string;
  current_period_end?: number;
  metadata?: Record<string, string> | null;
};

type StripeEvent = {
  id?: string;
  type?: string;
  data?: { object?: StripeCheckoutSession | StripeSubscriptionObject };
};

function stripeSecret() {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

function webhookSecret() {
  return process.env.PLATFORM_SUBSCRIPTION_STRIPE_WEBHOOK_SECRET?.trim() ?? "";
}

function priceIdFor(productCode: PlatformSubscriptionProductCode) {
  if (productCode === "numeria-studio") return process.env.NUMERIA_PRO_STRIPE_PRICE_ID?.trim() ?? "";
  return process.env.VELVET_PRO_STRIPE_PRICE_ID?.trim() ?? "";
}

function assertHttpsUrl(value: string, field: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error(`${field} must use https.`);
  return url.toString();
}

function metadataFrom(object: StripeCheckoutSession | StripeSubscriptionObject | undefined) {
  const metadata = object?.metadata ?? {};
  const workspaceId = String(metadata.workspaceId ?? "").trim();
  const ownerUserId = String(metadata.ownerUserId ?? "").trim();
  const productCode = String(metadata.productCode ?? "").trim();
  if (!workspaceId || !ownerUserId || !isPlatformSubscriptionProductCode(productCode)) return null;
  return { workspaceId, ownerUserId, productCode };
}

async function stripeRequest(path: string, init: RequestInit = {}) {
  const secret = stripeSecret();
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured.");

  const response = await fetch(`${stripeApiBaseUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${secret}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof (body as { error?: { message?: unknown } }).error?.message === "string"
      ? String((body as { error: { message: string } }).error.message)
      : `Stripe API request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }
  return body;
}

async function stripeFormPost(path: string, values: URLSearchParams) {
  return stripeRequest(path, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: values.toString(),
  });
}

async function fetchStripeSubscription(subscriptionId: string) {
  const safeId = encodeURIComponent(subscriptionId);
  return stripeRequest(`/subscriptions/${safeId}`, { method: "GET" }) as Promise<StripeSubscriptionObject>;
}

export async function createPlatformSubscriptionCheckout(input: PlatformSubscriptionCheckoutInput): Promise<PlatformSubscriptionCheckoutResult> {
  const priceId = priceIdFor(input.productCode);
  if (!priceId) throw new Error(`Stripe price is not configured for ${input.productCode}.`);

  const values = new URLSearchParams();
  values.set("mode", "subscription");
  values.set("line_items[0][price]", priceId);
  values.set("line_items[0][quantity]", "1");
  values.set("success_url", assertHttpsUrl(input.successUrl, "successUrl"));
  values.set("cancel_url", assertHttpsUrl(input.cancelUrl, "cancelUrl"));
  values.set("client_reference_id", `${input.productCode}:${input.workspaceId}:${input.ownerUserId}`.slice(0, 200));
  for (const [key, value] of Object.entries({
    workspaceId: input.workspaceId,
    ownerUserId: input.ownerUserId,
    productCode: input.productCode,
  })) {
    values.set(`metadata[${key}]`, value);
    values.set(`subscription_data[metadata][${key}]`, value);
  }

  const session = await stripeFormPost("/checkout/sessions", values) as StripeCheckoutSession;
  if (!session.id || !session.url) throw new Error("Stripe Checkout did not return a hosted checkout URL.");

  return {
    checkoutRef: session.id,
    redirectUrl: session.url,
    productCode: input.productCode,
    planId: "pro",
    paymentDetailsReturned: false,
    stripeObjectReturned: false,
  };
}

function parseStripeSignature(header: string) {
  const parts = header.split(",").map((part) => part.trim().split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1] ?? "";
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value).filter(Boolean);
  return { timestamp, signatures };
}

export function verifyPlatformSubscriptionStripeSignature(rawBody: string, signatureHeader: string | null) {
  const secret = webhookSecret();
  if (!secret || !signatureHeader) return false;
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds) || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > webhookToleranceSeconds) return false;

  const expectedHex = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expected = Buffer.from(expectedHex, "hex");
  return signatures.some((signature) => {
    try {
      const actual = Buffer.from(signature, "hex");
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  });
}

async function eventAlreadyProcessed(eventId: string) {
  const db = await getD1Database();
  if (!db) throw new Error("Growth Engine D1 DB binding is unavailable.");
  const existing = await db.prepare(
    "SELECT event_id FROM platform_subscription_webhook_events WHERE event_id = ? LIMIT 1",
  ).bind(eventId).first<{ event_id: string }>();
  return Boolean(existing);
}

async function recordProcessedEvent(eventId: string, eventType: string) {
  const db = await getD1Database();
  if (!db) throw new Error("Growth Engine D1 DB binding is unavailable.");
  await db.prepare(
    "INSERT OR IGNORE INTO platform_subscription_webhook_events (event_id, event_type, processed_at) VALUES (?, ?, ?)",
  ).bind(eventId, eventType, new Date().toISOString()).run();
}

function subscriptionState(status: string | undefined) {
  switch (status) {
    case "trialing": return { subscriptionStatus: "trialing" as const, entitlementStatus: "active" as const };
    case "active": return { subscriptionStatus: "active" as const, entitlementStatus: "active" as const };
    case "past_due":
    case "unpaid": return { subscriptionStatus: "past_due" as const, entitlementStatus: "past_due" as const };
    case "canceled": return { subscriptionStatus: "canceled" as const, entitlementStatus: "canceled" as const };
    default: return { subscriptionStatus: "expired" as const, entitlementStatus: "inactive" as const };
  }
}

async function persistSubscriptionState(input: {
  scope: { workspaceId: string; ownerUserId: string; productCode: PlatformSubscriptionProductCode };
  subscription: StripeSubscriptionObject;
  eventId: string;
}) {
  const state = subscriptionState(input.subscription.status);
  const validUntil = typeof input.subscription.current_period_end === "number"
    ? new Date(input.subscription.current_period_end * 1000).toISOString()
    : null;
  const stripeSubscriptionRef = input.subscription.id ?? null;
  const stripeCustomerRef = typeof input.subscription.customer === "string" ? input.subscription.customer : null;
  await upsertPlatformSubscriptionEntitlement({
    ...input.scope,
    planId: state.entitlementStatus === "active" ? "pro" : "free",
    ...state,
    validUntil,
    entitlementRef: stripeSubscriptionRef ? `stripe_sub:${stripeSubscriptionRef}` : `stripe_event:${input.eventId}`,
    stripeCustomerRef,
    stripeSubscriptionRef,
    updatedAt: new Date().toISOString(),
  });
  return state;
}

export async function applyPlatformSubscriptionStripeWebhook(rawBody: string, signatureHeader: string | null) {
  if (!verifyPlatformSubscriptionStripeSignature(rawBody, signatureHeader)) {
    return { ok: false as const, status: 400, errorCode: "INVALID_STRIPE_SIGNATURE" };
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return { ok: false as const, status: 400, errorCode: "INVALID_STRIPE_PAYLOAD" };
  }
  if (!event.id || !event.type) return { ok: false as const, status: 400, errorCode: "STRIPE_EVENT_FIELDS_MISSING" };

  const supported = ["checkout.session.completed", "customer.subscription.updated", "customer.subscription.deleted"];
  if (!supported.includes(event.type)) {
    return { ok: true as const, ignored: "unsupported_event", eventId: event.id };
  }

  if (await eventAlreadyProcessed(event.id)) {
    return { ok: true as const, ignored: "duplicate_event", eventId: event.id };
  }

  const object = event.data?.object;
  const scope = metadataFrom(object);
  if (!scope) return { ok: true as const, ignored: "subscription_scope_missing", eventId: event.id };

  let subscription: StripeSubscriptionObject;
  if (event.type === "checkout.session.completed") {
    const session = object as StripeCheckoutSession;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : "";
    if (!subscriptionId) {
      return { ok: false as const, status: 409, errorCode: "STRIPE_SUBSCRIPTION_REFERENCE_MISSING" };
    }
    subscription = await fetchStripeSubscription(subscriptionId);
    const subscriptionScope = metadataFrom(subscription);
    if (!subscriptionScope || subscriptionScope.workspaceId !== scope.workspaceId || subscriptionScope.ownerUserId !== scope.ownerUserId || subscriptionScope.productCode !== scope.productCode) {
      return { ok: false as const, status: 409, errorCode: "STRIPE_SUBSCRIPTION_SCOPE_MISMATCH" };
    }
  } else {
    subscription = object as StripeSubscriptionObject;
  }

  const state = await persistSubscriptionState({ scope, subscription, eventId: event.id });
  await recordProcessedEvent(event.id, event.type);

  return {
    ok: true as const,
    applied: true,
    eventId: event.id,
    planId: state.entitlementStatus === "active" ? "pro" as const : "free" as const,
    entitlementStatus: state.entitlementStatus,
  };
}

export function platformSubscriptionStripeReadiness() {
  return {
    implementationReady: true,
    stripeSecretConfigured: Boolean(stripeSecret()),
    webhookSecretConfigured: Boolean(webhookSecret()),
    numeriaPriceConfigured: Boolean(process.env.NUMERIA_PRO_STRIPE_PRICE_ID?.trim()),
    velvetPriceConfigured: Boolean(process.env.VELVET_PRO_STRIPE_PRICE_ID?.trim()),
    hostedCheckoutOnly: true,
    customerPaymentLedgerTouched: false,
    rawStripeObjectReturnedToProfessionalApps: false,
    businessPurchasable: false,
  };
}
