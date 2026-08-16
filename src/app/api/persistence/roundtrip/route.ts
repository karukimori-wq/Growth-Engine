import { NextResponse } from "next/server";
import { demoWorkspace, products } from "@/lib/mock-data";
import { apiError, resolveBusinessApiContext } from "@/server/api";
import { appName, getTimestamp } from "@/server/app-metadata";
import {
  createCustomer,
  createReservation,
  findCustomer,
  findReservation,
  getGrowthRepositoryDriver,
  hasPostgresEnvironment,
  listCustomers,
  listReservations
} from "@/server/repositories";

export const dynamic = "force-dynamic";

function createTestSchedule() {
  const scheduledStartAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const scheduledEndAt = new Date(scheduledStartAt.getTime() + 60 * 60 * 1000);

  return {
    scheduledStartAt: scheduledStartAt.toISOString(),
    scheduledEndAt: scheduledEndAt.toISOString()
  };
}

export async function POST(request: Request) {
  try {
    const context = await resolveBusinessApiContext(request, demoWorkspace.id);
    const repositoryDriver = getGrowthRepositoryDriver();
    const postgresConfigured = hasPostgresEnvironment();
    const checkedAt = getTimestamp();

    if (repositoryDriver !== "postgres" || !postgresConfigured) {
      return NextResponse.json(
        {
          appName,
          status: "warning",
          checkedAt,
          repositoryDriver,
          postgresConfigured,
          roundtripReady: false,
          roundtripStatus: "skipped",
          errorCode: "PERSISTENCE_NOT_CONFIGURED",
          message: "Postgres persistence is not active. Configure GROWTH_REPOSITORY_DRIVER=postgres and a supported Postgres URL env, then redeploy.",
          dataSafety: {
            envValuesExposed: false,
            paymentStatusSentOutsideGrowthEngine: false,
            salesAmountSentOutsideGrowthEngine: false,
            stripeDataSentOutsideGrowthEngine: false,
            customerMasterSentOutsideGrowthEngine: false
          },
          timestamp: getTimestamp()
        },
        { status: 200 }
      );
    }

    const product = products.find((item) => item.workspaceId === context.workspace.id && item.active) ?? products[0];
    const { scheduledStartAt, scheduledEndAt } = createTestSchedule();
    const customer = await createCustomer({
      workspaceId: context.workspace.id,
      displayName: "DB永続化確認用",
      contactInformation: {},
      snsAccounts: {},
      sourceChannel: "persistence_roundtrip",
      customerStatus: "active",
      totalRevenue: 0,
      purchaseCount: 0
    });
    const reservation = await createReservation({
      workspaceId: context.workspace.id,
      customerId: customer.id,
      productId: product.id,
      professionalStudioType: context.workspace.professionalStudioType,
      scheduledStartAt,
      scheduledEndAt,
      status: "requested",
      sourceChannel: "persistence_roundtrip",
      paymentStatus: "unpaid"
    });
    const [foundCustomer, foundReservation, customers, reservations] = await Promise.all([
      findCustomer(context.workspace.id, customer.id),
      findReservation(context.workspace.id, reservation.id),
      listCustomers(context.workspace.id),
      listReservations(context.workspace.id)
    ]);
    const customerFound = Boolean(foundCustomer);
    const reservationFound = Boolean(foundReservation);
    const roundtripReady = customerFound && reservationFound;

    return NextResponse.json(
      {
        appName,
        status: roundtripReady ? "success" : "error",
        checkedAt,
        repositoryDriver,
        postgresConfigured,
        roundtripReady,
        roundtripStatus: roundtripReady ? "success" : "error",
        createdRefs: {
          customerId: customer.id,
          reservationId: reservation.id,
          workspaceId: context.workspace.id
        },
        verification: {
          customerFound,
          reservationFound,
          customerVisibleInWorkspaceList: customers.some((item) => item.id === customer.id),
          reservationVisibleInWorkspaceList: reservations.some((item) => item.id === reservation.id)
        },
        dataSafety: {
          envValuesExposed: false,
          paymentStatusSentOutsideGrowthEngine: false,
          salesAmountSentOutsideGrowthEngine: false,
          stripeDataSentOutsideGrowthEngine: false,
          customerMasterSentOutsideGrowthEngine: false
        },
        issues: roundtripReady ? [] : ["Postgres roundtrip created records, but read-back verification failed."],
        timestamp: getTimestamp()
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Authenticated owner session is required.") {
      return NextResponse.json(
        {
          appName,
          status: "error",
          errorCode: "AUTH_REQUIRED",
          message: "Owner sign-in is required to run persistence roundtrip checks.",
          timestamp: getTimestamp()
        },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.toLowerCase().includes("postgres")) {
      return NextResponse.json(
        {
          appName,
          status: "error",
          errorCode: "POSTGRES_ROUNDTRIP_FAILED",
          message: error.message,
          dataSafety: {
            envValuesExposed: false,
            paymentStatusSentOutsideGrowthEngine: false,
            salesAmountSentOutsideGrowthEngine: false,
            stripeDataSentOutsideGrowthEngine: false,
            customerMasterSentOutsideGrowthEngine: false
          },
          timestamp: getTimestamp()
        },
        { status: 200 }
      );
    }

    return apiError(error);
  }
}
