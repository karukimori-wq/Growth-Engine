import { NextResponse } from "next/server";
import { z } from "zod";
import { demoWorkspace, products } from "@/lib/mock-data";
import { createCustomer, createReservation } from "@/server/repositories";

const publicBookingSchema = z.object({
  productId: z.string().default("prd_numeria_basic"),
  preferredDate: z.string().min(1),
  preferredTime: z.string().min(1),
  customerDisplayName: z.string().min(1).max(80).optional(),
  sourceChannel: z.string().default("public_booking")
});

function toReservationTimes(preferredDate: string, preferredTime: string, durationMinutes: number) {
  const scheduledStartAt = new Date(`${preferredDate}T${preferredTime}:00+09:00`);
  const scheduledEndAt = new Date(scheduledStartAt.getTime() + durationMinutes * 60 * 1000);

  return {
    scheduledStartAt: scheduledStartAt.toISOString(),
    scheduledEndAt: scheduledEndAt.toISOString()
  };
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = publicBookingSchema.safeParse({
    productId: formData.get("productId") ?? "prd_numeria_basic",
    preferredDate: formData.get("preferredDate"),
    preferredTime: formData.get("preferredTime"),
    customerDisplayName: formData.get("customerDisplayName") ?? undefined,
    sourceChannel: "public_booking"
  });

  if (!parsed.success) {
    const url = new URL("/public/booking", request.url);
    url.searchParams.set("status", "error");
    url.searchParams.set("reason", "invalid_booking_request");

    return NextResponse.redirect(url, 303);
  }

  const product =
    products.find(
      (item) =>
        item.workspaceId === demoWorkspace.id &&
        item.id === parsed.data.productId &&
        item.active
    ) ?? products[0];
  const { scheduledStartAt, scheduledEndAt } = toReservationTimes(
    parsed.data.preferredDate,
    parsed.data.preferredTime,
    product.durationMinutes
  );
  const customer = await createCustomer({
    workspaceId: demoWorkspace.id,
    displayName: parsed.data.customerDisplayName ?? "公開予約のお客様",
    contactInformation: {},
    snsAccounts: {},
    sourceChannel: parsed.data.sourceChannel,
    customerStatus: "active",
    totalRevenue: 0,
    purchaseCount: 0
  });
  const reservation = await createReservation({
    workspaceId: demoWorkspace.id,
    customerId: customer.id,
    productId: product.id,
    professionalStudioType: demoWorkspace.professionalStudioType,
    scheduledStartAt,
    scheduledEndAt,
    status: "requested",
    sourceChannel: parsed.data.sourceChannel,
    paymentStatus: "unpaid"
  });
  const url = new URL("/public/booking/confirmed", request.url);

  url.searchParams.set("reservationId", reservation.id);
  url.searchParams.set("workspaceId", demoWorkspace.id);
  url.searchParams.set("ownerUserId", demoWorkspace.ownerUserId);
  url.searchParams.set("customerId", customer.id);
  url.searchParams.set("productId", product.id);
  url.searchParams.set("scheduledStartAt", scheduledStartAt);

  return NextResponse.redirect(url, 303);
}
