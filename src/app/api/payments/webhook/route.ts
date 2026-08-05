import { NextResponse } from "next/server";
import { createStripeClient } from "@/integrations/stripe";
import { publishEvent } from "@/server/events";
import {
  createRevenue,
  findPaymentByStripePaymentIntent,
  hasProcessedStripeWebhookEvent,
  markPaymentPaid,
  markPaymentRefunded,
  recordProcessedStripeWebhookEvent,
  updateReservationPaymentStatus
} from "@/server/repositories";
import { demoWorkspace } from "@/lib/mock-data";

export async function POST(request: Request) {
  const payload = await request.json();
  const stripe = createStripeClient();
  const event = await stripe.parseWebhookEvent(payload);

  if (await hasProcessedStripeWebhookEvent(event.id)) {
    return NextResponse.json({ received: true, ignored: "duplicate_event", eventId: event.id });
  }

  if (event.type === "checkout.session.completed") {
    const payment = await findPaymentByStripePaymentIntent(demoWorkspace.id, event.stripePaymentIntentId);

    if (!payment) {
      return NextResponse.json({ received: true, ignored: "payment_not_found", eventId: event.id });
    }

    const paidPayment = await markPaymentPaid(payment, event.paidAt);
    const reservation = await updateReservationPaymentStatus(
      paidPayment.workspaceId,
      paidPayment.reservationId,
      "paid"
    );
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

    await recordProcessedStripeWebhookEvent(event.id);

    return NextResponse.json({ received: true, payment: paidPayment, reservation, revenue, event: publishedEvent });
  }

  const payment = await findPaymentByStripePaymentIntent(demoWorkspace.id, event.stripePaymentIntentId);

  if (!payment) {
    return NextResponse.json({ received: true, ignored: "payment_not_found", eventId: event.id });
  }

  const refundedPayment = await markPaymentRefunded(payment, event.refundStatus, event.refundedAt);
  const reservation = await updateReservationPaymentStatus(
    refundedPayment.workspaceId,
    refundedPayment.reservationId,
    "refunded"
  );
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

  await recordProcessedStripeWebhookEvent(event.id);

  return NextResponse.json({ received: true, payment: refundedPayment, reservation, event: publishedEvent });
}
