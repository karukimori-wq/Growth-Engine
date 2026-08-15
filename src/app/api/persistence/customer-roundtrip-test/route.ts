import { NextResponse } from "next/server";
import { demoWorkspace } from "@/lib/mock-data";
import { appName, getTimestamp } from "@/server/app-metadata";
import {
  createCustomer,
  findCustomer,
  getGrowthRepositoryDriver,
  hasPostgresEnvironment,
  listCustomers,
  updateCustomer
} from "@/server/repositories";

function configurationWarning() {
  const repositoryDriver = getGrowthRepositoryDriver();
  const postgresConfigured = hasPostgresEnvironment();

  return NextResponse.json(
    {
      appName,
      status: "warning",
      testName: "customer.persistence.roundtrip",
      repositoryDriver,
      postgresConfigured,
      databaseBackedPersistenceReady: false,
      error: {
        code: "CONFIGURATION_MISSING",
        message:
          "Postgres persistence is not active. Set a production Postgres connection and use the postgres Growth Repository driver before treating Customer persistence as ready."
      },
      sourceOfTruth: {
        customer: "growth-engine"
      },
      dataSafety: {
        staysInsideGrowthEngine: true,
        customerMasterSentOutsideGrowthEngine: false,
        paymentStatusSentOutsideGrowthEngine: false,
        salesAmountSentOutsideGrowthEngine: false,
        stripeDataSentOutsideGrowthEngine: false,
        fullReportBodySent: false,
        fullProfessionalMemoryBodySent: false,
        fullConversationHistorySent: false
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
    const customer = await createCustomer({
      workspaceId: demoWorkspace.id,
      displayName: "顧客永続化確認用",
      contactInformation: {},
      snsAccounts: {},
      sourceChannel: "customer_persistence_roundtrip_test",
      customerStatus: "active",
      totalRevenue: 0,
      purchaseCount: 0
    });

    const updatedCustomer = await updateCustomer(demoWorkspace.id, customer.id, {
      displayName: "顧客永続化確認用 更新済み",
      sourceChannel: "customer_persistence_roundtrip_test_updated"
    });

    const [foundCustomer, customers] = await Promise.all([
      findCustomer(demoWorkspace.id, customer.id),
      listCustomers(demoWorkspace.id)
    ]);

    const reflectedInList = customers.some((candidate) => candidate.id === customer.id);
    const detailFound = Boolean(foundCustomer);
    const updateApplied = updatedCustomer?.displayName === "顧客永続化確認用 更新済み";
    const success = reflectedInList && detailFound && updateApplied;

    return NextResponse.json(
      {
        appName,
        status: success ? "success" : "error",
        testName: "customer.persistence.roundtrip",
        repositoryDriver,
        postgresConfigured,
        databaseBackedPersistenceReady: true,
        workspaceId: demoWorkspace.id,
        ownerUserId: demoWorkspace.ownerUserId,
        createdCustomer: {
          customerId: customer.id,
          workspaceId: customer.workspaceId,
          customerNumber: customer.customerNumber
        },
        verification: {
          detailFound,
          reflectedInList,
          updateApplied,
          persistedAcrossRequestsExpected: true
        },
        sourceOfTruth: {
          customer: "growth-engine"
        },
        dataSafety: {
          staysInsideGrowthEngine: true,
          customerMasterSentOutsideGrowthEngine: false,
          paymentStatusSentOutsideGrowthEngine: false,
          salesAmountSentOutsideGrowthEngine: false,
          stripeDataSentOutsideGrowthEngine: false,
          fullReportBodySent: false,
          fullProfessionalMemoryBodySent: false,
          fullConversationHistorySent: false
        },
        error: success
          ? null
          : {
              code: "CONTRACT_VIOLATION",
              message: "Created or updated Customer was not readable from the Growth Repository."
            },
        timestamp: getTimestamp()
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown customer persistence error";

    return NextResponse.json(
      {
        appName,
        status: "error",
        testName: "customer.persistence.roundtrip",
        repositoryDriver,
        postgresConfigured,
        databaseBackedPersistenceReady: false,
        error: {
          code: "INTERNAL_ERROR",
          message
        },
        dataSafety: {
          staysInsideGrowthEngine: true,
          customerMasterSentOutsideGrowthEngine: false,
          paymentStatusSentOutsideGrowthEngine: false,
          salesAmountSentOutsideGrowthEngine: false,
          stripeDataSentOutsideGrowthEngine: false,
          fullReportBodySent: false,
          fullProfessionalMemoryBodySent: false,
          fullConversationHistorySent: false
        },
        timestamp: getTimestamp()
      },
      { status: 200 }
    );
  }
}
