import { NextResponse } from "next/server";
import { apiError, resolveBusinessApiContext } from "@/server/api";
import { recordAuditLog } from "@/server/audit-log";
import { publishEvent } from "@/server/events";
import { convertLeadToCustomer, findLead } from "@/server/repositories";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const apiContext = await resolveBusinessApiContext(request);
    const { id } = await context.params;
    const lead = await findLead(apiContext.workspace.id, id);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const customer = await convertLeadToCustomer(apiContext.workspace.id, lead);
    const event = await publishEvent({
      eventType: "growth.lead.converted.v1",
      source: "growth-engine",
      workspaceId: customer.workspaceId,
      payload: { customerId: customer.id, leadId: lead.id }
    });
    await recordAuditLog({
      workspaceId: customer.workspaceId,
      actorUserId: apiContext.user.id,
      action: "Lead.Converted",
      targetType: "lead",
      targetId: lead.id,
      metadata: {
        customerId: customer.id,
        sourceChannel: lead.sourceChannel
      }
    });

    return NextResponse.json({ customer, event }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
