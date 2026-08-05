import { NextResponse } from "next/server";
import { createStripeClient } from "@/integrations/stripe";
import { publishEvent } from "@/server/events";
import {
  createRevenue,
  findPaymentByStripePaymentIntent,
  markPaymentPaid,
  markPaymentRefunded
} from "@/server/repositories";
import { demoWorkspace } from "@/lib/mock-data";

export async function POST(request: Request) {
  const payload = await request.json();
  const stripe = createStripeClient();
  const event = await stripe.parseWebhookEvent(payload);

  if (event.type === "checkout.session.completed") {
    const payment = await findPaymentByStripePaymentIntent(demoWorkspace.id, event.stripePaymentIntentId);

    if (!payment) {
      return NextResponse.json({ received: true, ignored: "payment_not_found" });
    }

    const paidPayment = await markPaymentPaid(payment, event.paidAt);
    const revenue = await createRevenue({
      workspaceId: paidPayment.workspaceId,
      paymentId: paidPayment.id,
      customerId: paidPayment.customerId,
      productId: paidPayment.productId,
      amount: paidPayment.amount,
      occurredAt: event.paidAt,
      revenueType: "new"
    });
    const publishedEvent = await publishEvent({
      eventType: "growth.payment.completed.v1",
      source: "growth-engine",
      workspaceId: paidPayment.workspaceId,
      payload: {
        paymentId: paidPayment.id,
        revenueId: revenue.id,
        customerId: paidPayment.customerId,
        reservationId: paidPayment.reservationId,
        amount: paidPayment.amount,
        currency: paidPayment.currency
      }
    });

    return NextResponse.json({ received: true, payment: paidPayment, revenue, event: publishedEvent });
  }

  const payment = await findPaymentByStripePaymentIntent(demoWorkspace.id, event.stripePaymentIntentId);

  if (!payment) {
    return NextResponse.json({ received: true, ignored: "payment_not_found" });
  }

  const refundedPayment = await markPaymentRefunded(payment, event.refundStatus, event.refundedAt);
  const publishedEvent = await publishEvent({
    eventType: "growth.payment.refunded.v1",
    source: "growth-engine",
    workspaceId: refundedPayment.workspaceId,
    payload: {
      paymentId: refundedPayment.id,
      customerId: refundedPayment.customerId,
      reservationId: refundedPayment.reservationId,
      refundStatus: refundedPayment.refundStatus
    }
  });

  return NextResponse.json({ received: true, payment: refundedPayment, event: publishedEvent });
}
