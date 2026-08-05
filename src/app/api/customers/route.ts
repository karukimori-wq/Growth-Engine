import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, resolveBusinessApiContext } from "@/server/api";
import { recordAuditLog } from "@/server/audit-log";
import { publishEvent } from "@/server/events";
import { createCustomer, listCustomers } from "@/server/repositories";

const createCustomerSchema = z.object({
  workspaceId: z.string(),
  leadId: z.string().optional(),
  name: z.string().optional(),
  displayName: z.string(),
  contactInformation: z.record(z.string()).default({}),
  lineUserId: z.string().optional(),
  snsAccounts: z.record(z.string()).default({}),
  sourceChannel: z.string().optional(),
  sourceCampaignId: z.string().optional(),
  sourceContentId: z.string().optional(),
  referredByCustomerId: z.string().optional(),
  customerStatus: z.enum(["active", "inactive", "blocked"]).default("active"),
  firstPurchaseAt: z.string().optional(),
  lastPurchaseAt: z.string().optional(),
  totalRevenue: z.number().default(0),
  purchaseCount: z.number().int().default(0)
});

export async function GET(request: Request) {
  try {
    const context = await resolveBusinessApiContext(request);
    const records = await listCustomers(context.workspace.id);

    return NextResponse.json({ customers: records });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid customer.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const context = await resolveBusinessApiContext(request, parsed.data.workspaceId);
    const customer = await createCustomer(parsed.data);
    const event = await publishEvent({
      eventType: "growth.customer.created.v1",
      source: "growth-engine",
      workspaceId: customer.workspaceId,
      payload: { customerId: customer.id, leadId: customer.leadId }
    });
    await recordAuditLog({
      workspaceId: customer.workspaceId,
      actorUserId: context.user.id,
      action: "Customer.Created",
      targetType: "customer",
      targetId: customer.id,
      metadata: {
        operation: "create",
        leadId: customer.leadId,
        sourceChannel: customer.sourceChannel
      }
    });

    return NextResponse.json({ customer, event }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
