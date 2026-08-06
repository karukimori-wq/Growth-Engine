import { NextResponse } from "next/server";
import { z } from "zod";
import { createStripeClient } from "@/integrations/stripe";
import { apiError, resolveBusinessApiContext } from "@/server/api";
import { recordAuditLog } from "@/server/audit-log";
import { createPayment, findCustomer, findProduct } from "@/server/repositories";

const checkoutSchema = z.object({
  workspaceId: z.string(),
  customerId: z.string(),
  reservationId: z.string(),
  productId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout request.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const context = await resolveBusinessApiContext(request, parsed.data.workspaceId);
    const customer = await findCustomer(context.workspace.id, parsed.data.customerId);
    const product = await findProduct(context.workspace.id, parsed.data.productId);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const stripe = createStripeClient();
    const checkout = await stripe.createCheckoutSession({
      ...parsed.data,
      amount: product.price,
      currency: context.workspace.currency
    });
    const payment = await createPayment({
      workspaceId: context.workspace.id,
      createdByUserId: context.user.id,
      customerId: customer.id,
      reservationId: parsed.data.reservationId,
      productId: product.id,
      paymentProvider: "stripe",
      stripePaymentIntentId: checkout.stripePaymentIntentId,
      stripeCheckoutSessionId: checkout.stripeCheckoutSessionId,
      amount: product.price,
      currency: context.workspace.currency,
      paymentStatus: "pending",
      refundStatus: "none"
    });
    await recordAuditLog({
      workspaceId: payment.workspaceId,
      actorUserId: context.user.id,
      action: "Payment.CheckoutCreated",
      targetType: "payment",
      targetId: payment.id,
      metadata: {
        operation: "checkout_created",
        customerId: payment.customerId,
        reservationId: payment.reservationId,
        productId: payment.productId,
        paymentStatus: payment.paymentStatus
      }
    });

    return NextResponse.json({ payment, checkoutUrl: checkout.checkoutUrl }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
