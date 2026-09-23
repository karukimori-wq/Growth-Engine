import { createHash, timingSafeEqual } from "node:crypto";

import { getD1Database } from "@/server/d1-db";

export const platformSubscriptionProductCodes = ["numeria-studio", "velvet"] as const;
export type PlatformSubscriptionProductCode = (typeof platformSubscriptionProductCodes)[number];
export type PlatformSubscriptionPlanId = "free" | "pro";
export type PlatformSubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";
export type PlatformEntitlementStatus = "active" | "inactive" | "past_due" | "canceled";

export type PlatformSubscriptionEntitlement = {
  workspaceId: string;
  ownerUserId: string;
  productCode: PlatformSubscriptionProductCode;
  planId: PlatformSubscriptionPlanId;
  subscriptionStatus: PlatformSubscriptionStatus;
  entitlementStatus: PlatformEntitlementStatus;
  validUntil: string | null;
  entitlementRef: string;
  updatedAt: string;
};

type PlatformSubscriptionRow = {
  workspace_id: string;
  owner_user_id: string;
  product_code: string;
  plan_id: string;
  subscription_status: string;
  entitlement_status: string;
  valid_until: string | null;
  entitlement_ref: string;
  stripe_customer_ref: string | null;
  stripe_subscription_ref: string | null;
  updated_at: string;
};

export function isPlatformSubscriptionProductCode(value: unknown): value is PlatformSubscriptionProductCode {
  return typeof value === "string" && platformSubscriptionProductCodes.includes(value as PlatformSubscriptionProductCode);
}

function stableFreeEntitlementRef(input: { workspaceId: string; ownerUserId: string; productCode: string }) {
  const digest = createHash("sha256")
    .update(`${input.productCode}:${input.workspaceId}:${input.ownerUserId}`)
    .digest("hex")
    .slice(0, 18);
  return `ent_free_${digest}`;
}

function defaultFreeEntitlement(input: {
  workspaceId: string;
  ownerUserId: string;
  productCode: PlatformSubscriptionProductCode;
}): PlatformSubscriptionEntitlement {
  return {
    workspaceId: input.workspaceId,
    ownerUserId: input.ownerUserId,
    productCode: input.productCode,
    planId: "free",
    subscriptionStatus: "expired",
    entitlementStatus: "inactive",
    validUntil: null,
    entitlementRef: stableFreeEntitlementRef(input),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeStoredEntitlement(
  row: PlatformSubscriptionRow,
  input: { workspaceId: string; ownerUserId: string; productCode: PlatformSubscriptionProductCode },
): PlatformSubscriptionEntitlement {
  const planId: PlatformSubscriptionPlanId = row.plan_id === "pro" ? "pro" : "free";
  const subscriptionStatus: PlatformSubscriptionStatus = ["trialing", "active", "past_due", "canceled", "expired"].includes(row.subscription_status)
    ? row.subscription_status as PlatformSubscriptionStatus
    : "expired";
  const entitlementStatus: PlatformEntitlementStatus = ["active", "inactive", "past_due", "canceled"].includes(row.entitlement_status)
    ? row.entitlement_status as PlatformEntitlementStatus
    : "inactive";

  const proActive = planId === "pro" && (subscriptionStatus === "active" || subscriptionStatus === "trialing") && entitlementStatus === "active";
  if (!proActive) {
    return {
      ...defaultFreeEntitlement(input),
      subscriptionStatus,
      entitlementStatus,
      validUntil: row.valid_until ?? null,
      entitlementRef: row.entitlement_ref || stableFreeEntitlementRef(input),
      updatedAt: row.updated_at,
    };
  }

  return {
    workspaceId: row.workspace_id,
    ownerUserId: row.owner_user_id,
    productCode: input.productCode,
    planId: "pro",
    subscriptionStatus,
    entitlementStatus,
    validUntil: row.valid_until ?? null,
    entitlementRef: row.entitlement_ref,
    updatedAt: row.updated_at,
  };
}

export async function getPlatformSubscriptionEntitlement(input: {
  workspaceId: string;
  ownerUserId: string;
  productCode: PlatformSubscriptionProductCode;
}): Promise<PlatformSubscriptionEntitlement> {
  const db = await getD1Database();
  if (!db) throw new Error("Growth Engine D1 DB binding is unavailable.");

  const row = await db.prepare(
    `SELECT workspace_id, owner_user_id, product_code, plan_id, subscription_status,
            entitlement_status, valid_until, entitlement_ref, stripe_customer_ref,
            stripe_subscription_ref, updated_at
       FROM platform_subscriptions
      WHERE workspace_id = ? AND owner_user_id = ? AND product_code = ?
      LIMIT 1`,
  ).bind(input.workspaceId, input.ownerUserId, input.productCode).first<PlatformSubscriptionRow>();

  if (!row) return defaultFreeEntitlement(input);
  return normalizeStoredEntitlement(row, input);
}

export async function upsertPlatformSubscriptionEntitlement(input: PlatformSubscriptionEntitlement & {
  stripeCustomerRef?: string | null;
  stripeSubscriptionRef?: string | null;
}) {
  const db = await getD1Database();
  if (!db) throw new Error("Growth Engine D1 DB binding is unavailable.");

  await db.prepare(
    `INSERT INTO platform_subscriptions (
       workspace_id, owner_user_id, product_code, plan_id, subscription_status,
       entitlement_status, valid_until, entitlement_ref, stripe_customer_ref,
       stripe_subscription_ref, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(workspace_id, owner_user_id, product_code) DO UPDATE SET
       plan_id = excluded.plan_id,
       subscription_status = excluded.subscription_status,
       entitlement_status = excluded.entitlement_status,
       valid_until = excluded.valid_until,
       entitlement_ref = excluded.entitlement_ref,
       stripe_customer_ref = COALESCE(excluded.stripe_customer_ref, platform_subscriptions.stripe_customer_ref),
       stripe_subscription_ref = COALESCE(excluded.stripe_subscription_ref, platform_subscriptions.stripe_subscription_ref),
       updated_at = excluded.updated_at`,
  ).bind(
    input.workspaceId,
    input.ownerUserId,
    input.productCode,
    input.planId,
    input.subscriptionStatus,
    input.entitlementStatus,
    input.validUntil ?? null,
    input.entitlementRef,
    input.stripeCustomerRef ?? null,
    input.stripeSubscriptionRef ?? null,
    input.updatedAt,
  ).run();
}

export async function getPlatformSubscriptionReadiness() {
  const db = await getD1Database();
  const secretConfigured = Boolean(process.env.PLATFORM_SUBSCRIPTION_INTEGRATION_SECRET?.trim());
  const stripeSecretConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const webhookSecretConfigured = Boolean(process.env.PLATFORM_SUBSCRIPTION_STRIPE_WEBHOOK_SECRET?.trim());
  const numeriaPriceConfigured = Boolean(process.env.NUMERIA_PRO_STRIPE_PRICE_ID?.trim());
  const velvetPriceConfigured = Boolean(process.env.VELVET_PRO_STRIPE_PRICE_ID?.trim());
  const checkoutImplementationReady = true;

  if (!db) {
    return {
      status: "blocked" as const,
      d1Configured: false,
      tableReady: false,
      webhookEventTableReady: false,
      integrationSecretConfigured: secretConfigured,
      stripeSecretConfigured,
      webhookSecretConfigured,
      prices: { numeriaStudio: numeriaPriceConfigured, velvet: velvetPriceConfigured },
      entitlementReadReady: false,
      checkoutImplementationReady,
      checkoutReady: false,
      secretValuesExposed: false as const,
    };
  }

  let tableReady = false;
  let webhookEventTableReady = false;
  try {
    const row = await db.prepare("SELECT COUNT(*) AS count FROM platform_subscriptions").first<{ count: number }>();
    tableReady = typeof row?.count === "number";
  } catch {
    tableReady = false;
  }
  try {
    const row = await db.prepare("SELECT COUNT(*) AS count FROM platform_subscription_webhook_events").first<{ count: number }>();
    webhookEventTableReady = typeof row?.count === "number";
  } catch {
    webhookEventTableReady = false;
  }

  const entitlementReadReady = tableReady && secretConfigured;
  const checkoutReady = entitlementReadReady
    && webhookEventTableReady
    && checkoutImplementationReady
    && stripeSecretConfigured
    && webhookSecretConfigured
    && numeriaPriceConfigured;

  return {
    status: entitlementReadReady ? "ready" as const : "blocked" as const,
    d1Configured: true,
    tableReady,
    webhookEventTableReady,
    integrationSecretConfigured: secretConfigured,
    stripeSecretConfigured,
    webhookSecretConfigured,
    prices: { numeriaStudio: numeriaPriceConfigured, velvet: velvetPriceConfigured },
    entitlementReadReady,
    checkoutImplementationReady,
    checkoutReady,
    businessPurchasable: false,
    secretValuesExposed: false as const,
  };
}

export function isAuthorizedPlatformSubscriptionRequest(request: Request) {
  const configured = process.env.PLATFORM_SUBSCRIPTION_INTEGRATION_SECRET;
  const supplied = request.headers.get("x-platform-subscription-secret");
  if (!configured || !supplied) return false;

  const expected = Buffer.from(configured);
  const actual = Buffer.from(supplied);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
