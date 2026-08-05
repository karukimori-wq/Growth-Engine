import { NextResponse } from "next/server";
import { apiError, resolveBusinessApiContext } from "@/server/api";
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

    return NextResponse.json({ customer, event }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
