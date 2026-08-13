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

export default async function RepeatPage({ searchParams }: Props) {
  const query = await searchParams;
  const studioKey = first(query.studioKey) ?? demoWorkspace.professionalStudioType;
  const label = getBusinessMenuLabel("repeat", studioKey);
  const metrics = await getBusinessMetrics(demoWorkspace.id);
  const candidates = metrics.customerSales.filter(({ customer, latestReservation }) => customer.purchaseCount >= 1 || latestReservation);

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

        <section className="card">
          <div className="table-list">
            {candidates.map(({ customer, latestReservation }) => (
              <a className="row-link" href={`/app/business/customers/${customer.id}`} key={customer.id}>
                <span>
                  <strong>{customer.displayName}</strong>
                  <br />
                  <span className="muted">
                    利用回数 {customer.purchaseCount}回 / 最終予約{" "}
                    {latestReservation ? new Date(latestReservation.scheduledStartAt).toLocaleString("ja-JP") : "未設定"}
                  </span>
                </span>
                <span className="badge">フォロー候補</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
