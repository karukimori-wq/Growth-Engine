export type StudioKey = "numeria" | "velvet";

export type MenuItem = {
  label: string;
  href: string;
};

export type ProfessionalAppDefinition = {
  studioKey: StudioKey;
  studioName: string;
  professionalMenu: MenuItem[];
};

export const professionalApps: ProfessionalAppDefinition[] = [
  {
    studioKey: "numeria",
    studioName: "Numeria Studio",
    professionalMenu: [
      { label: "顧客", href: "/app/professional/numeria/customers" },
      { label: "新しい鑑定", href: "/app/professional/numeria/sessions/new" },
      { label: "鑑定履歴", href: "/app/professional/numeria/history" }
    ]
  },
  {
    studioKey: "velvet",
    studioName: "Velvet",
    professionalMenu: [
      { label: "顧客", href: "/app/professional/velvet/customers" },
      { label: "来店履歴", href: "/app/professional/velvet/visits" },
      { label: "メモ", href: "/app/professional/velvet/notes" }
    ]
  }
];

export const businessMenu: MenuItem[] = [
  { label: "今日やること", href: "/app/business/today" },
  { label: "集客", href: "/app/business/marketing" },
  { label: "見込み客", href: "/app/business/prospects" },
  { label: "予約", href: "/app/business/reservations" },
  { label: "売上", href: "/app/business/sales" },
  { label: "リピート", href: "/app/business/repeat" },
  { label: "紹介", href: "/app/business/referrals" },
  { label: "分析", href: "/app/business/analytics" }
];

export function getProfessionalApp(studioKey: string | undefined) {
  return professionalApps.find((app) => app.studioKey === studioKey) ?? professionalApps[0];
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
