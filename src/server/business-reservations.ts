import type { Customer, Product, Reservation } from "@/domain/entities";
import { customers, demoWorkspace, products } from "@/lib/mock-data";
import { listReservations } from "@/server/repositories";

export type BusinessReservationRecord = {
  reservation: Reservation;
  customer?: Customer;
  product?: Product;
};

export async function listBusinessReservations(
  workspaceId = demoWorkspace.id
): Promise<BusinessReservationRecord[]> {
  const repositoryReservations = await listReservations(workspaceId);

  return repositoryReservations.map((reservation) => ({
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
