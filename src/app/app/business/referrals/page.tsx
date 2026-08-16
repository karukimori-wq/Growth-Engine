import { demoWorkspace } from "@/lib/mock-data";
import { getBusinessMenuLabel } from "@/lib/professional-app-registry";
import { getBusinessMetrics } from "@/server/business-metrics";
import { buildReferralCandidateActions } from "@/server/business-next-actions";
import { BusinessSidebar } from "../_components/business-sidebar";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReferralsPage({ searchParams }: Props) {
  const query = await searchParams;
  const studioKey = first(query.studioKey) ?? demoWorkspace.professionalStudioType;
  const label = getBusinessMenuLabel("referrals", studioKey);
  const metrics = await getBusinessMetrics(demoWorkspace.id);
  const candidates = buildReferralCandidateActions(metrics.customerSales, demoWorkspace.currency);

  return (
    <div className="shell">
      <BusinessSidebar activeKey="referrals" studioKey={studioKey} />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / {label}</p>
            <h2 className="page-title">{label}</h2>
          </div>
          <a className="button secondary" href="/app/business/message-draft-briefs/new">
            依頼文案を作る
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
            <p className="metric">確認後依頼</p>
          </div>

          <div className="card span-12">
            <h3>紹介依頼候補</h3>
            <div className="table-list">
              {candidates.length > 0 ? candidates.map((candidate) => (
                <div className="row-link" key={candidate.customer.id}>
                  <span>
                    <strong>{candidate.customer.displayName}</strong>
                    <br />
                    <span className="muted">{candidate.reason}</span>
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
              )) : <p className="muted">現在のデータでは紹介依頼候補はありません。</p>}
            </div>
          </div>

          <div className="card span-12">
            <p className="muted">
              紹介候補はGrowth Engine内の顧客・予約・支払い記録から判断します。依頼文案の作成時も参照ID中心で連携します。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
