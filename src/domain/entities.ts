import type { Plan, ProfessionalStudioType, Role, Timestamp } from "./common";

export type Workspace = {
  id: string;
  name: string;
  ownerUserId: string;
  professionalStudioType: ProfessionalStudioType;
  plan: Plan;
  timezone: string;
  currency: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type User = {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited" | "disabled";
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type LeadStatus =
  | "new"
  | "contacted"
  | "line_registered"
  | "consultation_requested"
  | "consultation_booked"
  | "considering"
  | "won"
  | "lost"
  | "inactive";

export type Lead = {
  id: string;
  workspaceId: string;
  displayName: string;
  sourceChannel?: string;
  sourceCampaignId?: string;
  sourceContentId?: string;
  snsAccount?: string;
  lineUserId?: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  interestTags: string[];
  concernTags: string[];
  score?: number;
  assignedUserId?: string;
  firstContactAt?: Timestamp;
  lastContactAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Customer = {
  id: string;
  workspaceId: string;
  leadId?: string;
  customerNumber: string;
  name?: string;
  displayName: string;
  contactInformation: Record<string, string>;
  lineUserId?: string;
  snsAccounts: Record<string, string>;
  sourceChannel?: string;
  sourceCampaignId?: string;
  sourceContentId?: string;
  referredByCustomerId?: string;
  customerStatus: "active" | "inactive" | "blocked";
  firstPurchaseAt?: Timestamp;
  lastPurchaseAt?: Timestamp;
  totalRevenue: number;
  purchaseCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Campaign = {
  id: string;
  workspaceId: string;
  name: string;
  objective: "awareness" | "line_registration" | "consultation" | "reservation" | "repeat" | "referral";
  targetAudience: Record<string, unknown>;
  startAt?: Timestamp;
  endAt?: Timestamp;
  channels: string[];
  relatedProductIds: string[];
  status: "draft" | "active" | "paused" | "completed";
  budget?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Product = {
  id: string;
  workspaceId: string;
  professionalStudioType: ProfessionalStudioType;
  name: string;
  description?: string;
  category: string;
  price: number;
  durationMinutes: number;
  active: boolean;
  professionalServiceReference?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Reservation = {
  id: string;
  workspaceId: string;
  leadId?: string;
  customerId?: string;
  productId: string;
  professionalStudioType: ProfessionalStudioType;
  scheduledStartAt: Timestamp;
  scheduledEndAt: Timestamp;
  status: "requested" | "confirmed" | "cancelled" | "completed" | "no_show";
  sourceChannel?: string;
  campaignId?: string;
  contentId?: string;
  paymentStatus: "unpaid" | "paid" | "refunded";
  sessionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Followup = {
  id: string;
  workspaceId: string;
  leadId?: string;
  customerId?: string;
  reservationId?: string;
  sessionId?: string;
  type:
    | "consultation_followup"
    | "post_session_followup"
    | "repeat_offer"
    | "review_request"
    | "referral_request"
    | "inactive_customer_reactivation";
  scheduledAt: Timestamp;
  status: "scheduled" | "completed" | "dismissed";
  recommendedByAI: boolean;
  messageDraft?: string;
  sentAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type MarketingInsight = {
  id: string;
  workspaceId: string;
  insightType:
    | "funnel_bottleneck"
    | "content_topic"
    | "campaign_recommendation"
    | "followup_recommendation"
    | "repeat_recommendation"
    | "referral_recommendation"
    | "product_recommendation"
    | "revenue_risk"
    | "customer_segment";
  title: string;
  summary: string;
  evidence: string[];
  recommendedActions: string[];
  priority: "low" | "medium" | "high";
  confidence: number;
  status: "new" | "dismissed" | "completed";
  generatedAt: Timestamp;
  dismissedAt?: Timestamp;
  completedAt?: Timestamp;
};
