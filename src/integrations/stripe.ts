import { createHmac, timingSafeEqual } from "node:crypto";

export type StripeCheckoutRequest = {
  workspaceId: string;
  customerId: string;
  reservationId: string;
  productId: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
};

export type StripeCheckoutResponse = {
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string;
  checkoutUrl: string;
  mode: "test";
  cardDataStored: false;
};

export type StripeWebhookEvent =
  | {
      id: string;
      type: "checkout.session.completed";
      workspaceId: string;
      stripeCheckoutSessionId: string;
      stripePaymentIntentId: string;
      amount: number;
      currency: string;
      paidAt: string;
    }
  | {
      id: string;
      type: "charge.refunded";
      workspaceId: string;
      stripePaymentIntentId: string;
      refundStatus: "partial" | "full";
      refundedAt: string;
    };

export type StripeClient = {
  createCheckoutSession: (request: StripeCheckoutRequest) => Promise<StripeCheckoutResponse>;
  parseWebhookEvent: (rawBody: string, signatureHeader?: string | null) => Promise<StripeWebhookEvent>;
};

const stripeWebhookToleranceSeconds = 300;

function verifyStripeWebhookSignature(rawBody: string, signatureHeader: string, webhookSecret: string): boolean {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  const timestamp = parts.t;
  const expectedSignature = parts.v1;

  if (!timestamp || !expectedSignature) {
    return false;
  }

  const timestampSeconds = Number(timestamp);

  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  const timestampAgeSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);

  if (timestampAgeSeconds > stripeWebhookToleranceSeconds) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const actualSignature = createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");
  const actual = Buffer.from(actualSignature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}

export function createStripeClient(): StripeClient {
  return {
    async createCheckoutSession(request) {
      const idSuffix = Date.now();

      return {
        stripeCheckoutSessionId: `cs_demo_${idSuffix}`,
        stripePaymentIntentId: `pi_demo_${idSuffix}`,
        checkoutUrl: `https://checkout.stripe.com/c/pay/cs_demo_${idSuffix}?workspace=${request.workspaceId}`,
        mode: "test",
        cardDataStored: false
      };
    },
    async parseWebhookEvent(rawBody, signatureHeader) {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (webhookSecret) {
        if (!signatureHeader || !verifyStripeWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
          throw new Error("Invalid Stripe webhook signature.");
        }
      }

      const payload = JSON.parse(rawBody) as unknown;
      const event = payload as Partial<StripeWebhookEvent>;
      const fallbackEventId = `evt_demo_${Date.now()}`;

      if (event.type === "checkout.session.completed") {
        if (!event.workspaceId) {
          throw new Error("Stripe webhook event is missing workspaceId.");
        }

        return {
          id: event.id ?? fallbackEventId,
          type: event.type,
          workspaceId: event.workspaceId,
          stripeCheckoutSessionId: event.stripeCheckoutSessionId ?? `cs_demo_${Date.now()}`,
          stripePaymentIntentId: event.stripePaymentIntentId ?? `pi_demo_${Date.now()}`,
          amount: event.amount ?? 0,
          currency: event.currency ?? "JPY",
          paidAt: event.paidAt ?? new Date().toISOString()
        };
      }

      if (event.type === "charge.refunded") {
        if (!event.workspaceId) {
          throw new Error("Stripe webhook event is missing workspaceId.");
        }

        return {
          id: event.id ?? fallbackEventId,
          type: event.type,
          workspaceId: event.workspaceId,
          stripePaymentIntentId: event.stripePaymentIntentId ?? `pi_demo_${Date.now()}`,
          refundStatus: event.refundStatus ?? "full",
          refundedAt: event.refundedAt ?? new Date().toISOString()
        };
      }

      throw new Error("Unsupported Stripe webhook event.");
    }
  };
}
