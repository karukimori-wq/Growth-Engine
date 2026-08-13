import type { Customer, Product, Reservation } from "@/domain/entities";
import { demoWorkspace, products } from "@/lib/mock-data";
import { listCustomers, listReservations } from "@/server/repositories";

export type BusinessReservationRecord = {
  reservation: Reservation;
  customer?: Customer;
  product?: Product;
};

export async function listBusinessReservations(
  workspaceId = demoWorkspace.id
): Promise<BusinessReservationRecord[]> {
  const [repositoryReservations, repositoryCustomers] = await Promise.all([
    listReservations(workspaceId),
    listCustomers(workspaceId)
  ]);

  return repositoryReservations.map((reservation) => ({
    reservation,
    customer: reservation.customerId
      ? repositoryCustomers.find((customer) => customer.workspaceId === workspaceId && customer.id === reservation.customerId)
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
