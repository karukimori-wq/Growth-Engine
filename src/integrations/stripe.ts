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
};

export type StripeWebhookEvent =
  | {
      id: string;
      type: "checkout.session.completed";
      stripeCheckoutSessionId: string;
      stripePaymentIntentId: string;
      amount: number;
      currency: string;
      paidAt: string;
    }
  | {
      id: string;
      type: "charge.refunded";
      stripePaymentIntentId: string;
      refundStatus: "partial" | "full";
      refundedAt: string;
    };

export type StripeClient = {
  createCheckoutSession: (request: StripeCheckoutRequest) => Promise<StripeCheckoutResponse>;
  parseWebhookEvent: (payload: unknown) => Promise<StripeWebhookEvent>;
};

export function createStripeClient(): StripeClient {
  return {
    async createCheckoutSession(request) {
      const idSuffix = Date.now();

      return {
        stripeCheckoutSessionId: `cs_demo_${idSuffix}`,
        stripePaymentIntentId: `pi_demo_${idSuffix}`,
        checkoutUrl: `https://checkout.stripe.com/c/pay/cs_demo_${idSuffix}?workspace=${request.workspaceId}`
      };
    },
    async parseWebhookEvent(payload) {
      const event = payload as Partial<StripeWebhookEvent>;
      const fallbackEventId = `evt_demo_${Date.now()}`;

      if (event.type === "checkout.session.completed") {
        return {
          id: event.id ?? fallbackEventId,
          type: event.type,
          stripeCheckoutSessionId: event.stripeCheckoutSessionId ?? `cs_demo_${Date.now()}`,
          stripePaymentIntentId: event.stripePaymentIntentId ?? `pi_demo_${Date.now()}`,
          amount: event.amount ?? 0,
          currency: event.currency ?? "JPY",
          paidAt: event.paidAt ?? new Date().toISOString()
        };
      }

      if (event.type === "charge.refunded") {
        return {
          id: event.id ?? fallbackEventId,
          type: event.type,
          stripePaymentIntentId: event.stripePaymentIntentId ?? `pi_demo_${Date.now()}`,
          refundStatus: event.refundStatus ?? "full",
          refundedAt: event.refundedAt ?? new Date().toISOString()
        };
      }

      throw new Error("Unsupported Stripe webhook event.");
    }
  };
}
