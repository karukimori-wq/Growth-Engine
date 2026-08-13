import { demoWorkspace } from "@/lib/mock-data";
import { getBusinessMenuLabel } from "@/lib/professional-app-registry";
import { getBusinessMetrics, formatCurrency } from "@/server/business-metrics";
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
  const candidates = metrics.customerSales.filter(({ customer, paidAmount }) => customer.purchaseCount >= 2 || paidAmount >= 20000);

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

        <section className="card">
          <div className="table-list">
            {candidates.map(({ customer, paidAmount }) => (
              <a className="row-link" href={`/app/business/customers/${customer.id}`} key={customer.id}>
                <span>
                  <strong>{customer.displayName}</strong>
                  <br />
                  <span className="muted">
                    累計支払い済み {formatCurrency(paidAmount, demoWorkspace.currency)} / 利用回数 {customer.purchaseCount}回
                  </span>
                </span>
                <span className="badge">紹介候補</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
