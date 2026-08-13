import { demoWorkspace } from "@/lib/mock-data";
import { getBusinessMetrics, formatCurrency } from "@/server/business-metrics";
import { BusinessSidebar } from "../_components/business-sidebar";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const metrics = await getBusinessMetrics(demoWorkspace.id);

  return (
    <div className="shell">
      <BusinessSidebar activeKey="customers" />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / お客様</p>
            <h2 className="page-title">お客様一覧</h2>
          </div>
          <a className="button secondary" href="/app/business/reservations">
            予約を確認
          </a>
        </header>

        <section className="card">
          <div className="table-list">
            {metrics.customerSales.map(({ customer, paidAmount, paidCount, latestReservation }) => (
              <a className="row-link" href={`/app/business/customers/${customer.id}`} key={customer.id}>
                <span>
                  <strong>{customer.displayName}</strong>
                  <br />
                  <span className="muted">
                    {customer.customerNumber} / 売上 {formatCurrency(paidAmount, demoWorkspace.currency)} / 支払い済み {paidCount}件
                    {latestReservation ? ` / 次回 ${new Date(latestReservation.scheduledStartAt).toLocaleString("ja-JP")}` : ""}
                  </span>
                </span>
                <span className="badge">詳細</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
