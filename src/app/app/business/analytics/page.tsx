import { demoWorkspace } from "@/lib/mock-data";
import { getBusinessMenuLabel } from "@/lib/professional-app-registry";
import { getBusinessMetrics, formatCurrency } from "@/server/business-metrics";
import { buildReservationsByStatus, buildRevenueByProduct, buildRevenueBySource } from "@/server/business-analytics";
import { BusinessSidebar } from "../_components/business-sidebar";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const query = await searchParams;
  const studioKey = first(query.studioKey) ?? demoWorkspace.professionalStudioType;
  const label = getBusinessMenuLabel("analytics", studioKey);
  const metrics = await getBusinessMetrics(demoWorkspace.id);
  const reservationsByStatus = buildReservationsByStatus(metrics);
  const revenueBySource = buildRevenueBySource(metrics);
  const revenueByProduct = buildRevenueByProduct(metrics);
  const conversionRate = metrics.leads.length > 0
    ? Math.round((metrics.reservations.length / metrics.leads.length) * 100)
    : 0;

  return (
    <div className="shell">
      <BusinessSidebar activeKey="analytics" studioKey={studioKey} />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / {label}</p>
            <h2 className="page-title">{label}</h2>
          </div>
        </header>

        <section className="grid">
          <div className="card span-3">
            <p className="eyebrow">見込み客</p>
            <p className="metric">{metrics.leads.length}</p>
          </div>
          <div className="card span-3">
            <p className="eyebrow">予約</p>
            <p className="metric">{metrics.reservations.length}</p>
          </div>
          <div className="card span-3">
            <p className="eyebrow">顧客</p>
            <p className="metric">{metrics.customers.length}</p>
          </div>
          <div className="card span-3">
            <p className="eyebrow">売上</p>
            <p className="metric">{formatCurrency(metrics.paidSalesAmount, demoWorkspace.currency)}</p>
          </div>
          <div className="card span-12">
            <h3>簡易ファネル</h3>
            <dl className="definition-list">
              <dt>見込み客 → 予約</dt><dd>{conversionRate}%</dd>
              <dt>支払い済み予約</dt><dd>{metrics.paidReservationCount}件</dd>
              <dt>未払い予約</dt><dd>{metrics.unpaidReservationCount}件</dd>
              <dt>リピート候補</dt><dd>{metrics.repeatCandidateCount}名</dd>
              <dt>紹介候補</dt><dd>{metrics.referralCandidateCount}名</dd>
            </dl>
          </div>
          <div className="card span-4">
            <h3>予約状態</h3>
            <div className="table-list">
              {reservationsByStatus.map((row) => (
                <div className="row-link" key={row.key}>
                  <strong>{row.label}</strong>
                  <span className="badge">{row.count}件</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card span-4">
            <h3>流入元別売上</h3>
            <div className="table-list">
              {revenueBySource.length > 0 ? revenueBySource.map((row) => (
                <div className="row-link" key={row.key}>
                  <span>
                    <strong>{row.label}</strong>
                    <br />
                    <span className="muted">{row.count}件</span>
                  </span>
                  <span className="badge">{formatCurrency(row.amount, demoWorkspace.currency)}</span>
                </div>
              )) : <p className="muted">支払い済み売上はまだありません。</p>}
            </div>
          </div>
          <div className="card span-4">
            <h3>商品別売上</h3>
            <div className="table-list">
              {revenueByProduct.length > 0 ? revenueByProduct.map((row) => (
                <div className="row-link" key={row.key}>
                  <span>
                    <strong>{row.label}</strong>
                    <br />
                    <span className="muted">{row.count}件</span>
                  </span>
                  <span className="badge">{formatCurrency(row.amount, demoWorkspace.currency)}</span>
                </div>
              )) : <p className="muted">支払い済み売上はまだありません。</p>}
            </div>
          </div>
          <div className="card span-12">
            <p className="muted">
              この分析はGrowth Engine内の正本データから作成しています。Professional Appへ支払い状態や売上金額を送信しません。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
