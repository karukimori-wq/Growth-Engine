import { cookies } from "next/headers";
import type { Customer, Product, Reservation } from "@/domain/entities";
import { customers, demoWorkspace, products } from "@/lib/mock-data";
import { listReservations } from "@/server/repositories";
import {
  mergeReservations,
  parsePublicReservationsCookie,
  publicReservationsCookieName
} from "@/server/public-reservation-store";

export type BusinessReservationRecord = {
  reservation: Reservation;
  customer?: Customer;
  product?: Product;
};

export async function listBusinessReservations(workspaceId = demoWorkspace.id): Promise<BusinessReservationRecord[]> {
  const cookieStore = await cookies();
  const cookieReservations = parsePublicReservationsCookie(cookieStore.get(publicReservationsCookieName)?.value)
    .filter((reservation) => reservation.workspaceId === workspaceId);
  const repositoryReservations = await listReservations(workspaceId);

  return mergeReservations(repositoryReservations, cookieReservations).map((reservation) => ({
    reservation,
    customer: reservation.customerId
      ? customers.find((customer) => customer.workspaceId === workspaceId && customer.id === reservation.customerId)
      : undefined,
    product: products.find((product) => product.workspaceId === workspaceId && product.id === reservation.productId)
  }));
}

export async function getBusinessReservation(
  reservationId: string,
  workspaceId = demoWorkspace.id
): Promise<BusinessReservationRecord | undefined> {
  const reservations = await listBusinessReservations(workspaceId);

  return reservations.find((record) => record.reservation.id === reservationId);
}
