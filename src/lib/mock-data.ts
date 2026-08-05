import type {
  Customer,
  Lead,
  MarketingInsight,
  Payment,
  ProcessedExternalEvent,
  Product,
  Reservation,
  Revenue,
  Workspace
} from "@/domain/entities";

export const demoWorkspace: Workspace = {
  id: "ws_demo_numeria",
  name: "Numeria Studio Demo",
  ownerUserId: "user_demo_owner",
  professionalStudioType: "numeria",
  plan: "business",
  timezone: "Asia/Tokyo",
  currency: "JPY",
  createdAt: "2026-08-05T00:00:00.000Z",
  updatedAt: "2026-08-05T00:00:00.000Z"
};

export const todayReservations: Reservation[] = [
  {
    id: "res_001",
    workspaceId: demoWorkspace.id,
    customerId: "cus_001",
    productId: "prd_numeria_basic",
    professionalStudioType: "numeria",
    scheduledStartAt: "2026-08-05T10:00:00.000+09:00",
    scheduledEndAt: "2026-08-05T11:00:00.000+09:00",
    status: "confirmed",
    sourceChannel: "instagram",
    paymentStatus: "paid",
    createdAt: "2026-08-04T09:00:00.000Z",
    updatedAt: "2026-08-04T09:00:00.000Z"
  },
  {
    id: "res_002",
    workspaceId: demoWorkspace.id,
    customerId: "cus_002",
    productId: "prd_numeria_followup",
    professionalStudioType: "numeria",
    scheduledStartAt: "2026-08-05T14:00:00.000+09:00",
    scheduledEndAt: "2026-08-05T14:45:00.000+09:00",
    status: "confirmed",
    sourceChannel: "line",
    paymentStatus: "unpaid",
    createdAt: "2026-08-04T11:00:00.000Z",
    updatedAt: "2026-08-04T11:00:00.000Z"
  }
];

export const leads: Lead[] = [
  {
    id: "lead_001",
    workspaceId: demoWorkspace.id,
    displayName: "LINE相談 Aさん",
    sourceChannel: "line",
    sourceCampaignId: "cmp_august_love",
    status: "line_registered",
    interestTags: ["恋愛", "復縁"],
    concernTags: ["連絡が途切れた", "相手の気持ち"],
    score: 72,
    firstContactAt: "2026-08-03T10:00:00.000+09:00",
    lastContactAt: "2026-08-05T08:30:00.000+09:00",
    createdAt: "2026-08-03T01:00:00.000Z",
    updatedAt: "2026-08-04T23:30:00.000Z"
  },
  {
    id: "lead_002",
    workspaceId: demoWorkspace.id,
    displayName: "Instagram相談 Bさん",
    sourceChannel: "instagram",
    sourceCampaignId: "cmp_august_love",
    snsAccount: "@sample_b",
    status: "consultation_requested",
    interestTags: ["仕事"],
    concernTags: ["転職", "適職"],
    score: 64,
    firstContactAt: "2026-08-04T12:15:00.000+09:00",
    lastContactAt: "2026-08-04T12:15:00.000+09:00",
    createdAt: "2026-08-04T03:15:00.000Z",
    updatedAt: "2026-08-04T03:15:00.000Z"
  }
];

export const customers: Customer[] = [
  {
    id: "cus_001",
    workspaceId: demoWorkspace.id,
    leadId: "lead_closed_001",
    customerNumber: "C-0001",
    displayName: "リピーター Aさん",
    contactInformation: { email: "customer-a@example.com" },
    snsAccounts: { instagram: "@customer_a" },
    sourceChannel: "instagram",
    sourceCampaignId: "cmp_july_repeat",
    customerStatus: "active",
    firstPurchaseAt: "2026-07-10T10:00:00.000+09:00",
    lastPurchaseAt: "2026-08-05T10:00:00.000+09:00",
    totalRevenue: 42000,
    purchaseCount: 3,
    createdAt: "2026-07-10T01:00:00.000Z",
    updatedAt: "2026-08-05T01:00:00.000Z"
  },
  {
    id: "cus_002",
    workspaceId: demoWorkspace.id,
    customerNumber: "C-0002",
    displayName: "新規 Bさん",
    contactInformation: {},
    lineUserId: "line_demo_002",
    snsAccounts: {},
    sourceChannel: "line",
    customerStatus: "active",
    firstPurchaseAt: "2026-08-05T14:00:00.000+09:00",
    lastPurchaseAt: "2026-08-05T14:00:00.000+09:00",
    totalRevenue: 18000,
    purchaseCount: 1,
    createdAt: "2026-08-04T11:00:00.000Z",
    updatedAt: "2026-08-04T11:00:00.000Z"
  }
];

export const products: Product[] = [
  {
    id: "prd_numeria_basic",
    workspaceId: demoWorkspace.id,
    professionalStudioType: "numeria",
    name: "数秘術ベーシック鑑定",
    category: "numerology",
    price: 12000,
    durationMinutes: 60,
    active: true,
    professionalServiceReference: "numeria:numerology:basic",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z"
  },
  {
    id: "prd_numeria_followup",
    workspaceId: demoWorkspace.id,
    professionalStudioType: "numeria",
    name: "リピート鑑定",
    category: "followup",
    price: 18000,
    durationMinutes: 45,
    active: true,
    professionalServiceReference: "numeria:session:repeat",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z"
  }
];

export const payments: Payment[] = [
  {
    id: "pay_001",
    workspaceId: demoWorkspace.id,
    createdByUserId: demoWorkspace.ownerUserId,
    customerId: "cus_001",
    reservationId: "res_001",
    productId: "prd_numeria_basic",
    paymentProvider: "stripe",
    stripePaymentIntentId: "pi_demo_001",
    stripeCheckoutSessionId: "cs_demo_001",
    amount: 12000,
    currency: "JPY",
    paymentStatus: "paid",
    refundStatus: "none",
    paidAt: "2026-08-04T09:30:00.000Z",
    createdAt: "2026-08-04T09:00:00.000Z",
    updatedAt: "2026-08-04T09:30:00.000Z"
  }
];

export const revenues: Revenue[] = [
  {
    id: "rev_001",
    workspaceId: demoWorkspace.id,
    paymentId: "pay_001",
    customerId: "cus_001",
    productId: "prd_numeria_basic",
    campaignId: "cmp_july_repeat",
    sourceChannel: "instagram",
    amount: 12000,
    occurredAt: "2026-08-04T09:30:00.000Z",
    revenueType: "repeat",
    createdAt: "2026-08-04T09:30:00.000Z"
  }
];

export const processedExternalEvents: ProcessedExternalEvent[] = [];

export const insights: MarketingInsight[] = [
  {
    id: "insight_001",
    workspaceId: demoWorkspace.id,
    insightType: "funnel_bottleneck",
    title: "LINE登録から予約への転換が弱くなっています",
    summary: "先月より無料相談後の予約率が下がっています。相談後24時間以内のフォローを優先してください。",
    evidence: ["無料相談後予約率: 42% -> 31%", "未フォローの見込み客: 3名"],
    recommendedActions: ["未フォローの見込み客へメッセージ案を確認する", "予約導線のCTAを見直す"],
    priority: "high",
    confidence: 0.78,
    status: "new",
    generatedAt: "2026-08-05T00:00:00.000Z"
  },
  {
    id: "insight_002",
    workspaceId: demoWorkspace.id,
    insightType: "content_topic",
    title: "恋愛テーマの投稿ブリーフを作成できます",
    summary: "直近の相談タグで恋愛と復縁が増えています。SNS Plannerへ投稿ブリーフを送る候補です。",
    evidence: ["恋愛タグ: 前月比 +18%", "復縁タグ: 前月比 +11%"],
    recommendedActions: ["投稿目的をLINE登録に設定する", "SNS Plannerへ投稿ブリーフを作成依頼する"],
    priority: "medium",
    confidence: 0.72,
    status: "new",
    generatedAt: "2026-08-05T00:00:00.000Z"
  }
];
