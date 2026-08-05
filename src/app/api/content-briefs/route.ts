import { NextResponse } from "next/server";
import { z } from "zod";
import { createSnsPlannerClient } from "@/integrations/sns-planner";
import { apiError, resolveBusinessApiContext } from "@/server/api";
import { recordAuditLog } from "@/server/audit-log";

const contentBriefSchema = z.object({
  workspaceId: z.string(),
  campaignId: z.string().optional(),
  purpose: z.string(),
  targetAudience: z.object({
    ageRange: z.string().optional(),
    gender: z.string().optional(),
    concerns: z.array(z.string())
  }),
  cta: z.string(),
  channel: z.enum(["instagram", "x", "tiktok", "youtube", "blog"]),
  tone: z.string().optional(),
  constraints: z.array(z.string()).default([]),
  sourceInsights: z.array(z.string()).optional(),
  dueDate: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = contentBriefSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content brief.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const context = await resolveBusinessApiContext(request, parsed.data.workspaceId);
    const snsPlanner = createSnsPlannerClient();
    const draft = await snsPlanner.requestPostDraft(parsed.data);

    await recordAuditLog({
      workspaceId: context.workspace.id,
      actorUserId: context.user.id,
      action: "ContentBrief.Requested",
      targetType: "snsPlannerDraft",
      targetId: draft.draftId,
      metadata: {
        campaignId: parsed.data.campaignId,
        channel: parsed.data.channel,
        purpose: parsed.data.purpose
      }
    });

    return NextResponse.json({ ...draft }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
