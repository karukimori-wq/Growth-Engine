import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, resolveBusinessApiContext } from "@/server/api";
import { publishEvent } from "@/server/events";
import { createReservation, findCustomer, findProduct, listReservations } from "@/server/repositories";

const createReservationSchema = z.object({
  workspaceId: z.string(),
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  productId: z.string(),
  scheduledStartAt: z.string(),
  scheduledEndAt: z.string(),
  status: z.enum(["requested", "confirmed", "cancelled", "completed", "no_show"]).default("requested"),
  sourceChannel: z.string().optional(),
  campaignId: z.string().optional(),
  contentId: z.string().optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).default("unpaid")
});

export async function GET() {
  try {
    const context = await resolveBusinessApiContext();
    const records = await listReservations(context.workspace.id);

    return NextResponse.json({ reservations: records });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createReservationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reservation.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const context = await resolveBusinessApiContext(parsed.data.workspaceId);
    const product = await findProduct(context.workspace.id, parsed.data.productId);

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (parsed.data.customerId) {
      const customer = await findCustomer(context.workspace.id, parsed.data.customerId);

      if (!customer) {
        return NextResponse.json({ error: "Customer not found." }, { status: 404 });
      }
    }

    const reservation = await createReservation({
      ...parsed.data,
      professionalStudioType: context.workspace.professionalStudioType
    });
    const event = await publishEvent({
      eventType: "growth.reservation.created.v1",
      source: "growth-engine",
      workspaceId: reservation.workspaceId,
      payload: {
        reservationId: reservation.id,
        customerId: reservation.customerId,
        productId: reservation.productId
      }
    });

    return NextResponse.json({ reservation, event }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
