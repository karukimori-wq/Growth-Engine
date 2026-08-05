import { NextResponse } from "next/server";
import { z } from "zod";
import { createSnsPlannerClient } from "@/integrations/sns-planner";
import { requireBusinessAccess, requireWorkspaceAccess } from "@/server/authz";
import { recordAuditLog } from "@/server/audit-log";
import { resolveWorkspaceContext } from "@/server/workspace";

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
  const context = await resolveWorkspaceContext();
  const body = await request.json();
  const parsed = contentBriefSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content brief.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    requireBusinessAccess(context);
    requireWorkspaceAccess(context, parsed.data.workspaceId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }

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
}
