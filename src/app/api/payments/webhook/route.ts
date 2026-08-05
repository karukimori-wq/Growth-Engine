import { NextResponse } from "next/server";
import { createStripeClient } from "@/integrations/stripe";
import { recordAuditLog } from "@/server/audit-log";
import {
  createRevenue,
  findPaymentByStripePaymentIntent,
  hasProcessedExternalEvent,
  markPaymentPaid,
  markPaymentRefunded,
  recordProcessedExternalEvent,
  updateReservationPaymentStatus
} from "@/server/repositories";

export async function POST(request: Request) {
  const stripe = createStripeClient();
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");
  let event;

  try {
    event = await stripe.parseWebhookEvent(rawBody, signatureHeader);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook." }, { status: 400 });
  }

  if (await hasProcessedExternalEvent(event.workspaceId, "stripe", event.id)) {
    return NextResponse.json({ received: true, ignored: "duplicate_event", eventId: event.id });
  }

  if (event.type === "checkout.session.completed") {
    const payment = await findPaymentByStripePaymentIntent(event.workspaceId, event.stripePaymentIntentId);

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
    await recordProcessedExternalEvent({
      workspaceId: paidPayment.workspaceId,
      provider: "stripe",
      externalEventId: event.id,
      eventType: event.type
    });
    await recordAuditLog({
      workspaceId: paidPayment.workspaceId,
      actorUserId: "system:stripe",
      action: "Payment.Completed",
      targetType: "payment",
      targetId: paidPayment.id,
      metadata: {
        stripeEventId: event.id,
        reservationId: paidPayment.reservationId,
        customerId: paidPayment.customerId,
        paymentStatus: paidPayment.paymentStatus
      }
    });

    return NextResponse.json({ received: true, payment: paidPayment, reservation, revenue });
  }

  const payment = await findPaymentByStripePaymentIntent(event.workspaceId, event.stripePaymentIntentId);

  if (!payment) {
    return NextResponse.json({ received: true, ignored: "payment_not_found", eventId: event.id });
  }

  const refundedPayment = await markPaymentRefunded(payment, event.refundStatus, event.refundedAt);
  const reservation = await updateReservationPaymentStatus(
    refundedPayment.workspaceId,
    refundedPayment.reservationId,
    "refunded"
  );
  await recordProcessedExternalEvent({
    workspaceId: refundedPayment.workspaceId,
    provider: "stripe",
    externalEventId: event.id,
    eventType: event.type
  });
  await recordAuditLog({
    workspaceId: refundedPayment.workspaceId,
    actorUserId: "system:stripe",
    action: "Payment.Refunded",
    targetType: "payment",
    targetId: refundedPayment.id,
    metadata: {
      stripeEventId: event.id,
      reservationId: refundedPayment.reservationId,
      customerId: refundedPayment.customerId,
      refundStatus: refundedPayment.refundStatus
    }
  });

  return NextResponse.json({ received: true, payment: refundedPayment, reservation });
}
