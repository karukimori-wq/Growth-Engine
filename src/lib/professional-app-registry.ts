export type StudioKey = "numeria" | "velvet";

export type MenuItem = {
  key: string;
  label: string;
  href: string;
};

export type BusinessMenuKey =
  | "today"
  | "marketing"
  | "prospects"
  | "reservations"
  | "sales"
  | "repeat"
  | "referrals"
  | "analytics";

export type BusinessMenuDefinition = {
  key: BusinessMenuKey;
  defaultLabel: string;
  href: string;
  labels: Record<StudioKey, string>;
};

export type ProfessionalAppDefinition = {
  studioKey: StudioKey;
  studioName: string;
  appType: "professional";
  domain: string;
  target: string;
  professionalMenu: MenuItem[];
  professionalResponsibilities: string[];
  growthEngineResponsibilities: string[];
  handoffToStudioFields: string[];
  handoffFromStudioFields: string[];
  deniedStudioFields: string[];
};

export const professionalApps: ProfessionalAppDefinition[] = [
  {
    studioKey: "numeria",
    studioName: "Numeria Studio",
    appType: "professional",
    domain: "appraisal-sessions / reports",
    target: "占い師向けの鑑定業務管理",
    professionalMenu: [
      { key: "customers", label: "顧客", href: "/app/professional/numeria/customers" },
      { key: "sessions", label: "新しい鑑定", href: "/app/professional/numeria/sessions/new" },
      { key: "history", label: "鑑定履歴", href: "/app/professional/numeria/history" }
    ],
    professionalResponsibilities: ["鑑定Session", "鑑定内容", "Report", "鑑定履歴"],
    growthEngineResponsibilities: [
      "Customer正本",
      "Lead / Prospect",
      "Reservation",
      "Payment",
      "Sales",
      "paymentStatus",
      "salesAmount",
      "リピート候補",
      "紹介",
      "分析"
    ],
    handoffToStudioFields: ["workspaceId", "userId", "customerId", "reservationId", "intent"],
    handoffFromStudioFields: ["sessionId", "reportId", "nextActionRef", "summaryRef"],
    deniedStudioFields: [
      "paymentStatus",
      "salesAmount",
      "Stripe情報",
      "顧客マスター全文",
      "機密メモ全文",
      "売上正本",
      "支払い正本"
    ]
  },
  {
    studioKey: "velvet",
    studioName: "Velvet",
    appType: "professional",
    domain: "professional-memory / visit-records",
    target: "成人の事業者・店舗運営者向けの業務管理",
    professionalMenu: [
      { key: "customers", label: "顧客", href: "/app/professional/velvet/customers" },
      { key: "visits", label: "来店履歴", href: "/app/professional/velvet/visits" },
      { key: "notes", label: "メモ", href: "/app/professional/velvet/notes" }
    ],
    professionalResponsibilities: [
      "来店履歴",
      "接客メモ",
      "好み",
      "注意点",
      "会話メモ",
      "前回対応内容",
      "専門タイムライン",
      "顧客クイックカード",
      "Recall UI"
    ],
    growthEngineResponsibilities: [
      "Customer正本",
      "Lead / Prospect",
      "Visit Schedule / Reservation",
      "Payment",
      "Sales",
      "paymentStatus",
      "salesAmount",
      "顧客別売上",
      "リピート候補",
      "紹介",
      "分析"
    ],
    handoffToStudioFields: ["workspaceId", "userId", "customerId", "reservationId", "visitScheduleId", "intent"],
    handoffFromStudioFields: ["visitId", "noteId", "lastVisitAt", "nextActionRef", "summaryRef"],
    deniedStudioFields: [
      "paymentStatus",
      "salesAmount",
      "Stripe情報",
      "顧客マスター全文",
      "機密メモ全文",
      "売上正本",
      "支払い正本"
    ]
  }
];

export const businessMenuDefinitions: BusinessMenuDefinition[] = [
  {
    key: "today",
    defaultLabel: "今日やること",
    href: "/app/business/today",
    labels: { numeria: "今日やること", velvet: "今日やること" }
  },
  {
    key: "marketing",
    defaultLabel: "集客",
    href: "/app/business/marketing",
    labels: { numeria: "SNS / LINE集客", velvet: "来店促進 / 営業連絡" }
  },
  {
    key: "prospects",
    defaultLabel: "見込み客",
    href: "/app/business/prospects",
    labels: { numeria: "LINE登録者", velvet: "初回来店候補 / 連絡中" }
  },
  {
    key: "reservations",
    defaultLabel: "予約",
    href: "/app/business/reservations",
    labels: { numeria: "鑑定予約", velvet: "来店予定" }
  },
  {
    key: "sales",
    defaultLabel: "売上",
    href: "/app/business/sales",
    labels: { numeria: "鑑定売上", velvet: "来店売上 / 顧客別売上" }
  },
  {
    key: "repeat",
    defaultLabel: "リピート",
    href: "/app/business/repeat",
    labels: { numeria: "次回鑑定案内", velvet: "再来店フォロー" }
  },
  {
    key: "referrals",
    defaultLabel: "紹介",
    href: "/app/business/referrals",
    labels: { numeria: "紹介", velvet: "紹介" }
  },
  {
    key: "analytics",
    defaultLabel: "分析",
    href: "/app/business/analytics",
    labels: { numeria: "分析", velvet: "来店・売上分析" }
  }
];

export const businessMenu: MenuItem[] = businessMenuDefinitions.map((item) => ({
  key: item.key,
  label: item.defaultLabel,
  href: item.href
}));

export function getProfessionalApp(studioKey: string | undefined) {
  return professionalApps.find((app) => app.studioKey === studioKey) ?? professionalApps[0];
}

export function isStudioKey(value: string | undefined): value is StudioKey {
  return value === "numeria" || value === "velvet";
}

export function getBusinessMenu(studioKey: string | undefined): MenuItem[] {
  const app = getProfessionalApp(studioKey);

  return businessMenuDefinitions.map((item) => {
    const params = new URLSearchParams({ studioKey: app.studioKey });

    return {
      key: item.key,
      label: item.labels[app.studioKey] ?? item.defaultLabel,
      href: `${item.href}?${params.toString()}`
    };
  });
}

export function getBusinessMenuLabel(menuKey: BusinessMenuKey, studioKey: string | undefined) {
  const app = getProfessionalApp(studioKey);
  const definition = businessMenuDefinitions.find((item) => item.key === menuKey);

  return definition?.labels[app.studioKey] ?? definition?.defaultLabel ?? menuKey;
}

export function getBusinessActionForStudio(studioKey: string | undefined) {
  if (studioKey === "velvet") {
    return {
      label: "来店記録を作成",
      href: "/app/professional/velvet/visits",
      description: "Velvet側の来店履歴・接客メモへ参照IDだけを渡す設計です。"
    };
  }

  return {
    label: "鑑定を開始",
    href: undefined,
    description: "Numeria Studioへ reservationId / customerId などの参照IDだけを渡します。"
  };
}
