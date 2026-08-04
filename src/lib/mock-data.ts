import type { MarketingInsight, Reservation, Workspace } from "@/domain/entities";

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
