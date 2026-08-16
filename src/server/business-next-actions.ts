import type { Reservation } from "@/domain/entities";
import type { CustomerSalesRecord } from "@/server/business-metrics";
import { formatCurrency } from "@/server/business-metrics";

export type BusinessCandidateAction = {
  customer: CustomerSalesRecord["customer"];
  latestReservation?: Reservation;
  priority: "high" | "medium" | "low";
  reason: string;
  nextAction: string;
  messagePurpose: "repeat_offer" | "referral_request";
  messageDraftHref: string;
};

function daysSince(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const elapsedMs = Date.now() - new Date(value).getTime();
  return Math.max(0, Math.floor(elapsedMs / 86_400_000));
}

function buildMessageDraftHref(input: {
  customerId: string;
  reservationId?: string;
  purpose: BusinessCandidateAction["messagePurpose"];
  returnTo: string;
}) {
  const params = new URLSearchParams({
    customerId: input.customerId,
    purpose: input.purpose,
    followupId: `followup_${input.purpose}_${input.customerId}`,
    returnTo: input.returnTo
  });

  if (input.reservationId) {
    params.set("reservationId", input.reservationId);
  }

  return `/app/business/message-draft-briefs/new?${params.toString()}`;
}

export function buildRepeatCandidateActions(
  records: CustomerSalesRecord[],
  currency: string
): BusinessCandidateAction[] {
  return records
    .filter(({ customer, latestReservation }) => customer.purchaseCount >= 1 || latestReservation)
    .map(({ customer, paidAmount, latestReservation }) => {
      const lastUseDays = daysSince(customer.lastPurchaseAt ?? latestReservation?.scheduledStartAt);
      const priority: BusinessCandidateAction["priority"] =
        lastUseDays === undefined ? "medium" : lastUseDays >= 75 ? "high" : lastUseDays >= 30 ? "medium" : "low";
      const reason =
        lastUseDays === undefined
          ? "利用履歴がありますが、最終利用日の情報が不足しています。"
          : `最終利用から約${lastUseDays}日経過しています。`;

      return {
        customer,
        latestReservation,
        priority,
        reason: `${reason} 累計支払い済み ${formatCurrency(paidAmount, currency)}。`,
        nextAction: priority === "high" ? "再案内の連絡文案を確認" : "次回案内のタイミングを確認",
        messagePurpose: "repeat_offer" as const,
        messageDraftHref: buildMessageDraftHref({
          customerId: customer.id,
          reservationId: latestReservation?.id,
          purpose: "repeat_offer",
          returnTo: "/app/business/repeat"
        })
      };
    })
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
}

export function buildReferralCandidateActions(
  records: CustomerSalesRecord[],
  currency: string
): BusinessCandidateAction[] {
  return records
    .filter(({ customer, paidAmount }) => customer.purchaseCount >= 2 || paidAmount >= 20000)
    .map(({ customer, paidAmount, paidCount, latestReservation }) => {
      const priority: BusinessCandidateAction["priority"] =
        customer.purchaseCount >= 3 || paidAmount >= 30000 ? "high" : "medium";

      return {
        customer,
        latestReservation,
        priority,
        reason: `利用回数 ${customer.purchaseCount}回 / 支払い済み ${paidCount}件 / 累計 ${formatCurrency(paidAmount, currency)}。`,
        nextAction: "紹介依頼の文案を確認",
        messagePurpose: "referral_request" as const,
        messageDraftHref: buildMessageDraftHref({
          customerId: customer.id,
          reservationId: latestReservation?.id,
          purpose: "referral_request",
          returnTo: "/app/business/referrals"
        })
      };
    })
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
}

function priorityRank(priority: BusinessCandidateAction["priority"]) {
  const ranks: Record<BusinessCandidateAction["priority"], number> = {
    high: 0,
    medium: 1,
    low: 2
  };

  return ranks[priority];
}
