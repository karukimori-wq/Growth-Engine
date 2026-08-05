export type SnsChannel = "instagram" | "x" | "tiktok" | "youtube" | "blog";

export type SnsTargetAudience = {
  ageRange?: string;
  gender?: string;
  concerns: string[];
};

export type SnsPlannerBriefRequest = {
  workspaceId: string;
  campaignId?: string;
  purpose: string;
  targetAudience: SnsTargetAudience;
  cta: string;
  channel: SnsChannel;
  tone?: string;
  constraints: string[];
  sourceInsights?: string[];
  dueDate?: string;
};

export type SnsPlannerDraftResponse = {
  draftId: string;
  status: "draft" | "review" | "approved" | "published";
  channel: SnsChannel;
  publishedAt: string | null;
  trackingLinkId: string | null;
};

export type SnsPlannerClient = {
  requestPostDraft: (brief: SnsPlannerBriefRequest) => Promise<SnsPlannerDraftResponse>;
};

export function createSnsPlannerClient(): SnsPlannerClient {
  return {
    async requestPostDraft(brief) {
      return {
        draftId: `draft_${Date.now()}`,
        status: "draft",
        channel: brief.channel,
        publishedAt: null,
        trackingLinkId: null
      };
    }
  };
}
