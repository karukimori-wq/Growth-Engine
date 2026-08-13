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

export default async function SalesPage({ searchParams }: Props) {
  const query = await searchParams;
  const studioKey = first(query.studioKey) ?? demoWorkspace.professionalStudioType;
  const label = getBusinessMenuLabel("sales", studioKey);
  const metrics = await getBusinessMetrics(demoWorkspace.id);

  return (
    <div className="shell">
      <BusinessSidebar activeKey="sales" studioKey={studioKey} />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / {label}</p>
            <h2 className="page-title">{label}</h2>
          </div>
          <a className="button secondary" href="/app/business/reservations">
            予約別に確認
          </a>
        </header>

        <section className="grid">
          <div className="card span-4">
            <p className="eyebrow">支払い済み</p>
            <p className="metric">{formatCurrency(metrics.paidSalesAmount, demoWorkspace.currency)}</p>
          </div>
          <div className="card span-4">
            <p className="eyebrow">支払い済み予約</p>
            <p className="metric">{metrics.paidReservationCount}件</p>
          </div>
          <div className="card span-4">
            <p className="eyebrow">未払い予約</p>
            <p className="metric">{metrics.unpaidReservationCount}件</p>
          </div>

          <div className="card span-6">
            <h3>顧客別売上</h3>
            <div className="table-list">
              {metrics.customerSales.map(({ customer, paidAmount, paidCount, pendingAmount }) => (
                <a className="row-link" href={`/app/business/customers/${customer.id}`} key={customer.id}>
                  <span>
                    <strong>{customer.displayName}</strong>
                    <br />
                    <span className="muted">
                      paid {formatCurrency(paidAmount, demoWorkspace.currency)} / pending{" "}
                      {formatCurrency(pendingAmount, demoWorkspace.currency)} / {paidCount}件
                    </span>
                  </span>
                  <span className="badge">顧客</span>
                </a>
              ))}
            </div>
          </div>

          <div className="card span-6">
            <h3>予約別決済状態</h3>
            <div className="table-list">
              {metrics.reservationPayments.map(({ reservation, customer, payment }) => (
                <a className="row-link" href={`/app/business/reservations/${reservation.id}`} key={reservation.id}>
                  <span>
                    <strong>{customer?.displayName ?? reservation.customerId ?? "未紐付け"}</strong>
                    <br />
                    <span className="muted">
                      {reservation.id} / reservation: {reservation.paymentStatus} / payment:{" "}
                      {payment?.paymentStatus ?? "未作成"}
                    </span>
                  </span>
                  <span className={reservation.paymentStatus === "paid" ? "badge" : "badge warning"}>
                    {reservation.paymentStatus}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="card span-12">
            <p className="muted">
              Payment / paymentStatus / salesAmount / Stripe連携はGrowth Engine正本です。Professional App、SNS Planner、AI Platform Coreへは送信しません。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
