import { notFound } from "next/navigation";
import { createNumeriaStartUrl, mvpFollowupContext, practitionerUserId } from "@/lib/screen-flow";
import { demoWorkspace } from "@/lib/mock-data";
import { getBusinessReservation } from "@/server/business-reservations";
import { createReservationFromReference } from "@/server/public-reservation-store";

type Props = {
  params: Promise<{ reservationId: string }>;
  searchParams: Promise<{
    workspaceId?: string;
    customerId?: string;
    productId?: string;
    scheduledStartAt?: string;
    scheduledEndAt?: string;
    sourceChannel?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default async function ReservationDetailPage({ params, searchParams }: Props) {
  const { reservationId } = await params;
  const query = await searchParams;
  const fallbackReservation = createReservationFromReference({
    reservationId,
    ...query
  });
  const record = await getBusinessReservation(
    reservationId,
    demoWorkspace.id,
    fallbackReservation ? [fallbackReservation] : []
  );

  if (!record) {
    notFound();
  }

  const { reservation, customer, product } = record;
  const customerId = reservation.customerId ?? "customer_reference_pending";
  const numeriaStartUrl = createNumeriaStartUrl(
    reservation.id,
    customerId,
    reservation.workspaceId,
    practitionerUserId
  );
  const handoffPayload = {
    workspaceId: reservation.workspaceId,
    userId: practitionerUserId,
    sourceApp: "growth-engine",
    reservationId: reservation.id,
    customerRef: { customerId },
    sessionType: "numerology",
    intent: "start_appraisal_session"
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="brand">Numeria Studio</h1>
        <nav>
          <div className="nav-group">
            <p className="nav-title">Business</p>
            <a className="nav-link" href="/app/business">今日やること</a>
            <a className="nav-link active" href="/app/business/reservations">予約</a>
            <a className="nav-link" href={`/app/business/followups/${mvpFollowupContext.followupId}`}>フォロー</a>
          </div>
        </nav>
      </aside>
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Business / 予約詳細</p>
            <h2 className="page-title">予約詳細</h2>
          </div>
          <a className="button secondary" href="/app/business/reservations">一覧へ戻る</a>
        </header>

        <section className="grid">
          <div className="card span-8">
            <h3>鑑定開始に必要な参照情報</h3>
            <dl className="definition-list">
              <dt>予約ID</dt><dd>{reservation.id}</dd>
              <dt>お客様</dt><dd>{customer?.displayName ?? "公開予約のお客様"}</dd>
              <dt>Customer参照ID</dt><dd>{customerId}</dd>
              <dt>鑑定メニュー</dt><dd>{product?.name ?? reservation.productId}</dd>
              <dt>日時</dt><dd>{formatDateTime(reservation.scheduledStartAt)}</dd>
            </dl>
            <div className="action-row">
              <a className="button" href={numeriaStartUrl}>鑑定を開始</a>
              <a className="button secondary" href={`/app/business/followups/${mvpFollowupContext.followupId}`}>鑑定後フォローを確認</a>
            </div>
          </div>

          <div className="card span-4">
            <h3>Numeria Studioへ渡す内容</h3>
            <pre className="code-block">{JSON.stringify(handoffPayload, null, 2)}</pre>
            <p className="muted">paymentStatus、売上金額、連絡先、Report本文、全文カルテは送信しません。</p>
          </div>
        </section>
      </main>
    </div>
  );
}
