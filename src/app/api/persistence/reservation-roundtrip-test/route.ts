import { NextResponse } from "next/server";
import { demoWorkspace, products } from "@/lib/mock-data";
import { appName, getTimestamp } from "@/server/app-metadata";
import {
  createCustomer,
  createReservation,
  findCustomer,
  findReservation,
  getGrowthRepositoryDriver,
  hasPostgresEnvironment,
  listReservations
} from "@/server/repositories";

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60 * 1000);
}

function configurationWarning() {
  const repositoryDriver = getGrowthRepositoryDriver();
  const postgresConfigured = hasPostgresEnvironment();

  return NextResponse.json(
    {
      appName,
      status: "warning",
      testName: "reservation.persistence.roundtrip",
      repositoryDriver,
      postgresConfigured,
      databaseBackedPersistenceReady: false,
      error: {
        code: "CONFIGURATION_MISSING",
        message:
          "Postgres persistence is not active. Set a production Postgres connection and use the postgres Growth Repository driver before treating reservation persistence as ready."
      },
      dataSafety: {
        staysInsideGrowthEngine: true,
        paymentStatusSentOutsideGrowthEngine: false,
        salesAmountSentOutsideGrowthEngine: false,
        stripeDataSentOutsideGrowthEngine: false,
        customerMasterSentOutsideGrowthEngine: false,
        fullReportBodySent: false,
        fullProfessionalMemoryBodySent: false
      },
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}

export async function POST() {
  const repositoryDriver = getGrowthRepositoryDriver();
  const postgresConfigured = hasPostgresEnvironment();

  if (repositoryDriver !== "postgres" || !postgresConfigured) {
    return configurationWarning();
  }

  try {
    const product = products.find((candidate) => candidate.workspaceId === demoWorkspace.id) ?? products[0];
    const scheduledStartAt = addMinutes(new Date(), 24 * 60).toISOString();
    const scheduledEndAt = addMinutes(new Date(scheduledStartAt), product.durationMinutes).toISOString();

    const customer = await createCustomer({
      workspaceId: demoWorkspace.id,
      displayName: "永続化確認用",
      contactInformation: {},
      snsAccounts: {},
      sourceChannel: "persistence_roundtrip_test",
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
      sourceChannel: "persistence_roundtrip_test",
      paymentStatus: "unpaid"
    });

    const [foundCustomer, foundReservation, reservations] = await Promise.all([
      findCustomer(demoWorkspace.id, customer.id),
      findReservation(demoWorkspace.id, reservation.id),
      listReservations(demoWorkspace.id)
    ]);

    const reflectedInList = reservations.some((candidate) => candidate.id === reservation.id);
    const detailFound = Boolean(foundReservation);
    const customerFound = Boolean(foundCustomer);
    const success = reflectedInList && detailFound && customerFound;

    return NextResponse.json(
      {
        appName,
        status: success ? "success" : "error",
        testName: "reservation.persistence.roundtrip",
        repositoryDriver,
        postgresConfigured,
        databaseBackedPersistenceReady: true,
        workspaceId: demoWorkspace.id,
        ownerUserId: demoWorkspace.ownerUserId,
        createdCustomer: {
          customerId: customer.id,
          workspaceId: customer.workspaceId
        },
        createdReservation: {
          reservationId: reservation.id,
          workspaceId: reservation.workspaceId,
          customerId: reservation.customerId,
          productId: reservation.productId,
          status: reservation.status
        },
        verification: {
          customerFound,
          detailFound,
          reflectedInList,
          persistedAcrossRequestsExpected: true
        },
        dataSafety: {
          staysInsideGrowthEngine: true,
          paymentStatusSentOutsideGrowthEngine: false,
          salesAmountSentOutsideGrowthEngine: false,
          stripeDataSentOutsideGrowthEngine: false,
          customerMasterSentOutsideGrowthEngine: false,
          fullReportBodySent: false,
          fullProfessionalMemoryBodySent: false
        },
        error: success
          ? null
          : {
              code: "CONTRACT_VIOLATION",
              message: "Created reservation or customer was not readable from the Growth Repository."
            },
        timestamp: getTimestamp()
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown persistence error";

    return NextResponse.json(
      {
        appName,
        status: "error",
        testName: "reservation.persistence.roundtrip",
        repositoryDriver,
        postgresConfigured,
        databaseBackedPersistenceReady: false,
        error: {
          code: "INTERNAL_ERROR",
          message
        },
        dataSafety: {
          staysInsideGrowthEngine: true,
          paymentStatusSentOutsideGrowthEngine: false,
          salesAmountSentOutsideGrowthEngine: false,
          stripeDataSentOutsideGrowthEngine: false,
          customerMasterSentOutsideGrowthEngine: false,
          fullReportBodySent: false,
          fullProfessionalMemoryBodySent: false
        },
        timestamp: getTimestamp()
      },
      { status: 200 }
    );
  }
}
