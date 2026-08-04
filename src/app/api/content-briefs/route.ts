import { NextResponse } from "next/server";
import { z } from "zod";
import { demoWorkspace } from "@/lib/mock-data";
import { canAccessBusiness } from "@/lib/plan";

const contentBriefSchema = z.object({
  workspaceId: z.string(),
  professionalStudioId: z.string(),
  campaignId: z.string(),
  objective: z.enum(["awareness", "line_registration", "consultation", "reservation", "repeat", "referral"]),
  targetAudience: z.object({
    ageRange: z.string(),
    gender: z.string(),
    concerns: z.array(z.string())
  }),
  topic: z.string(),
  contentType: z.enum(["feed", "reel", "story", "short_video", "blog"]),
  channel: z.enum(["instagram", "x", "tiktok", "youtube", "blog"]),
  callToAction: z.string(),
  sourceInsights: z.array(z.string()),
  dueDate: z.string()
});

export async function POST(request: Request) {
  if (!canAccessBusiness(demoWorkspace.plan)) {
    return NextResponse.json({ error: "Business plan is required." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = contentBriefSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content brief.", details: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(
    {
      draftId: `draft_${Date.now()}`,
      status: "draft",
      channel: parsed.data.channel,
      publishedAt: null,
      trackingLinkId: null
    },
    { status: 201 }
  );
}
