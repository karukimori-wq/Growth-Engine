import { demoWorkspace } from "@/lib/mock-data";
import { getBusinessMenuLabel } from "@/lib/professional-app-registry";
import { getBusinessMetrics } from "@/server/business-metrics";
import { BusinessSidebar } from "../_components/business-sidebar";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProspectsPage({ searchParams }: Props) {
  const query = await searchParams;
  const studioKey = first(query.studioKey) ?? demoWorkspace.professionalStudioType;
  const label = getBusinessMenuLabel("prospects", studioKey);
  const metrics = await getBusinessMetrics(demoWorkspace.id);

  return (
    <div className="shell">
      <BusinessSidebar activeKey="prospects" studioKey={studioKey} />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / {label}</p>
            <h2 className="page-title">{label}</h2>
          </div>
          <a className="button secondary" href="/app/business/reservations">
            予約へ進める
          </a>
        </header>

        <section className="grid">
          <div className="card span-4">
            <p className="eyebrow">未成約候補</p>
            <p className="metric">{metrics.leads.length}名</p>
          </div>
          <div className="card span-4">
            <p className="eyebrow">予約済み</p>
            <p className="metric">{metrics.reservations.length}件</p>
          </div>
          <div className="card span-4">
            <p className="eyebrow">顧客化済み</p>
            <p className="metric">{metrics.customers.length}名</p>
          </div>

          <div className="card span-12">
            <h3>対応候補</h3>
            <div className="table-list">
              {metrics.leads.map((lead) => (
                <div className="row-link" key={lead.id}>
                  <span>
                    <strong>{lead.displayName}</strong>
                    <br />
                    <span className="muted">
                      {lead.status} / {lead.sourceChannel ?? "source未設定"} / score {lead.score ?? "-"}
                    </span>
                  </span>
                  <span className="badge">次の連絡</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
