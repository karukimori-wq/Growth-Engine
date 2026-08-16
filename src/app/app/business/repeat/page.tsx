import { demoWorkspace } from "@/lib/mock-data";
import { getBusinessMenuLabel } from "@/lib/professional-app-registry";
import { getBusinessMetrics } from "@/server/business-metrics";
import { buildRepeatCandidateActions } from "@/server/business-next-actions";
import { BusinessSidebar } from "../_components/business-sidebar";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RepeatPage({ searchParams }: Props) {
  const query = await searchParams;
  const studioKey = first(query.studioKey) ?? demoWorkspace.professionalStudioType;
  const label = getBusinessMenuLabel("repeat", studioKey);
  const metrics = await getBusinessMetrics(demoWorkspace.id);
  const candidates = buildRepeatCandidateActions(metrics.customerSales, demoWorkspace.currency);

  return (
    <div className="shell">
      <BusinessSidebar activeKey="repeat" studioKey={studioKey} />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / {label}</p>
            <h2 className="page-title">{label}</h2>
          </div>
          <a className="button secondary" href="/app/business/message-draft-briefs/new">
            連絡文案を作る
          </a>
        </header>

        <section className="grid">
          <div className="card span-4">
            <p className="eyebrow">候補</p>
            <p className="metric">{candidates.length}名</p>
          </div>
          <div className="card span-4">
            <p className="eyebrow">優先度高</p>
            <p className="metric">{candidates.filter((candidate) => candidate.priority === "high").length}名</p>
          </div>
          <div className="card span-4">
            <p className="eyebrow">方針</p>
            <p className="metric">確認後送信</p>
          </div>

          <div className="card span-12">
            <h3>次回案内候補</h3>
            <div className="table-list">
              {candidates.length > 0 ? candidates.map((candidate) => (
                <div className="row-link" key={candidate.customer.id}>
                  <span>
                    <strong>{candidate.customer.displayName}</strong>
                    <br />
                    <span className="muted">
                      {candidate.reason} 最終予約{" "}
                      {candidate.latestReservation ? new Date(candidate.latestReservation.scheduledStartAt).toLocaleString("ja-JP") : "未設定"}
                    </span>
                    <br />
                    <span className="muted">次の行動: {candidate.nextAction}</span>
                  </span>
                  <span className="action-row">
                    <a className="button secondary" href={`/app/business/customers/${candidate.customer.id}`}>
                      顧客
                    </a>
                    <a className="button" href={candidate.messageDraftHref}>
                      文案
                    </a>
                  </span>
                </div>
              )) : <p className="muted">現在のデータでは次回案内候補はありません。</p>}
            </div>
          </div>

          <div className="card span-12">
            <p className="muted">
              リピート判断はGrowth Engine内のCustomer / Reservation / Payment正本から作成します。外部アプリへ支払い状態や売上金額は送信しません。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
