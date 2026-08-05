import { NextResponse } from "next/server";
import { z } from "zod";
import { publishEvent } from "@/server/events";
import { createLead, listLeads } from "@/server/repositories";
import { apiError, resolveBusinessApiContext } from "@/server/api";

const createLeadSchema = z.object({
  workspaceId: z.string(),
  displayName: z.string(),
  sourceChannel: z.string().optional(),
  sourceCampaignId: z.string().optional(),
  sourceContentId: z.string().optional(),
  snsAccount: z.string().optional(),
  lineUserId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z
    .enum([
      "new",
      "contacted",
      "line_registered",
      "consultation_requested",
      "consultation_booked",
      "considering",
      "won",
      "lost",
      "inactive"
    ])
    .default("new"),
  interestTags: z.array(z.string()).default([]),
  concernTags: z.array(z.string()).default([]),
  score: z.number().min(0).max(100).optional(),
  assignedUserId: z.string().optional(),
  firstContactAt: z.string().optional(),
  lastContactAt: z.string().optional()
});

export async function GET() {
  try {
    const context = await resolveBusinessApiContext();
    const records = await listLeads(context.workspace.id);

    return NextResponse.json({ leads: records });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createLeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await resolveBusinessApiContext(parsed.data.workspaceId);
    const lead = await createLead(parsed.data);

    const event = await publishEvent({
      eventType: "growth.lead.created.v1",
      source: "growth-engine",
      workspaceId: lead.workspaceId,
      payload: { leadId: lead.id, sourceChannel: lead.sourceChannel }
    });

    return NextResponse.json({ lead, event }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
