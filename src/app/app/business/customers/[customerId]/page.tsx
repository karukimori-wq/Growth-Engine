import { notFound } from "next/navigation";
import { demoWorkspace } from "@/lib/mock-data";
import { findCustomer, listReservations, listPayments } from "@/server/repositories";
import { formatCurrency } from "@/server/business-metrics";
import { buildCustomerActivityTimeline } from "@/server/customer-activity-timeline";
import { BusinessSidebar } from "../../_components/business-sidebar";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ customerId: string }>;
};

export default async function CustomerDetailPage({ params }: Props) {
  const { customerId } = await params;
  const [customer, reservations, payments] = await Promise.all([
    findCustomer(demoWorkspace.id, customerId),
    listReservations(demoWorkspace.id),
    listPayments(demoWorkspace.id)
  ]);

  if (!customer) {
    notFound();
  }

  const customerReservations = reservations.filter((reservation) => reservation.customerId === customer.id);
  const customerPayments = payments.filter((payment) => payment.customerId === customer.id);
  const paidAmount = customerPayments
    .filter((payment) => payment.paymentStatus === "paid")
    .reduce((total, payment) => total + payment.amount, 0);
  const timeline = buildCustomerActivityTimeline({
    customer,
    reservations: customerReservations,
    payments: customerPayments
  });

  return (
    <div className="shell">
      <BusinessSidebar activeKey="customers" />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / Customer正本</p>
            <h2 className="page-title">{customer.displayName}</h2>
          </div>
          <div className="action-row">
            <a className="button secondary" href="/app/business/customers">
              一覧へ戻る
            </a>
            <a className="button" href={`/app/business/customers/${customer.id}/edit`}>
              編集
            </a>
          </div>
        </header>

        <section className="grid">
          <div className="card span-6">
            <h3>基本情報</h3>
            <dl className="definition-list">
              <dt>customerId</dt><dd>{customer.id}</dd>
              <dt>顧客番号</dt><dd>{customer.customerNumber}</dd>
              <dt>状態</dt><dd>{customer.customerStatus}</dd>
              <dt>流入元</dt><dd>{customer.sourceChannel ?? "未設定"}</dd>
              <dt>LINE ID</dt><dd>{customer.lineUserId ?? "未設定"}</dd>
            </dl>
          </div>

          <div className="card span-6">
            <h3>売上サマリー</h3>
            <dl className="definition-list">
              <dt>支払い済み売上</dt><dd>{formatCurrency(paidAmount, demoWorkspace.currency)}</dd>
              <dt>支払い記録</dt><dd>{customerPayments.length}件</dd>
              <dt>予約</dt><dd>{customerReservations.length}件</dd>
              <dt>Growth Engine正本</dt><dd>Customer / Payment / Sales</dd>
            </dl>
          </div>

          <div className="card span-12">
            <h3>予約</h3>
            <div className="table-list">
              {customerReservations.length > 0 ? (
                customerReservations.map((reservation) => (
                  <a className="row-link" href={`/app/business/reservations/${reservation.id}`} key={reservation.id}>
                    <span>
                      <strong>{new Date(reservation.scheduledStartAt).toLocaleString("ja-JP")}</strong>
                      <br />
                      <span className="muted">
                        {reservation.id} / {reservation.status} / {reservation.paymentStatus}
                      </span>
                    </span>
                    <span className="badge">予約詳細</span>
                  </a>
                ))
              ) : (
                <p className="muted">この顧客に紐づく予約はまだありません。</p>
              )}
            </div>
          </div>

          <div className="card span-12">
            <h3>活動タイムライン</h3>
            <p className="muted">
              Growth Engineが正本として持つ顧客・予約・決済の履歴です。Report本文や外部アプリの専門記録本文はコピーしません。
            </p>
            <div className="timeline-list">
              {timeline.map((entry) => (
                <div className="timeline-entry" key={entry.id}>
                  <div>
                    <strong>{entry.title}</strong>
                    <p className="muted">{entry.summary}</p>
                    <span className="muted">{new Date(entry.occurredAt).toLocaleString("ja-JP")}</span>
                  </div>
                  <div className="timeline-actions">
                    {entry.statusLabel ? <span className="badge">{entry.statusLabel}</span> : null}
                    {entry.href ? (
                      <a className="button secondary" href={entry.href}>
                        開く
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
