import { NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";

export const runtime = "nodejs";

export async function GET() {
  const velvetIntegrationSecretConfigured = Boolean(process.env.VELVET_INTEGRATION_SECRET?.trim());

  return NextResponse.json(
    {
      appName,
      integration: "velvet",
      status: velvetIntegrationSecretConfigured ? "success" : "warning",
      checkedAt: getTimestamp(),
      runtime: {
        velvetIntegrationSecretConfigured,
        secretValueExposed: false
      },
      customerCreateEndpoint: {
        method: "POST",
        path: "/api/integrations/velvet/customers",
        requiresHeaders: ["X-Source-App: velvet", "X-Velvet-Integration-Secret"],
        acceptedPayloadFields: ["workspaceId", "userId", "displayName"],
        returns: ["status", "operation", "eventName", "customer.customerId", "customer.displayName"],
        sourceOfTruth: "growth-engine"
      },
      expectedSuccess: {
        httpStatus: 201,
        status: "success",
        operation: "Customer.Create",
        eventName: "growth.customer.created.v1",
        customerIdReturned: true
      },
      dataSafety: {
        paymentStatusReturnedToVelvet: false,
        salesAmountReturnedToVelvet: false,
        stripeDataReturnedToVelvet: false,
        customerMasterReturnedToVelvet: false,
        customerSourceOfTruthDelegatedToVelvet: false
      },
      issues: velvetIntegrationSecretConfigured
        ? []
        : ["VELVET_INTEGRATION_SECRET is not configured in Growth Engine runtime."],
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}
