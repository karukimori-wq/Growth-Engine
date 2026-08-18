import { notFound } from "next/navigation";
import { createNumeriaStartUrl, mvpFollowupContext, practitionerUserId } from "@/lib/screen-flow";
import { demoWorkspace } from "@/lib/mock-data";
import { getBusinessActionForStudio, getBusinessMenu, getBusinessMenuLabel, getProfessionalApp } from "@/lib/professional-app-registry";
import { getBusinessReservation } from "@/server/business-reservations";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ reservationId: string }>;
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

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    requested: "受付済み",
    confirmed: "確定",
    cancelled: "キャンセル",
    completed: "完了",
    no_show: "無断キャンセル"
  };

  return labels[status] ?? status;
}

function paymentStatusLabel(status: string | undefined) {
  const labels: Record<string, string> = {
    unpaid: "未払い",
    paid: "支払い済み",
    refunded: "返金済み",
    cancelled: "キャンセル"
  };

  return labels[status ?? ""] ?? "未設定";
}

export default async function ReservationDetailPage({ params }: Props) {
  const { reservationId } = await params;
  const record = await getBusinessReservation(reservationId, demoWorkspace.id);

  if (!record) {
    notFound();
  }

  const { reservation, customer, product } = record;
  const professionalApp = getProfessionalApp(reservation.professionalStudioType);
  const businessMenu = getBusinessMenu(professionalApp.studioKey);
  const reservationLabel = getBusinessMenuLabel("reservations", professionalApp.studioKey);
  const businessAction = getBusinessActionForStudio(reservation.professionalStudioType);
  const customerId = reservation.customerId ?? "customer_reference_pending";
  const followupId = `followup_${reservation.id}_post_session`;
  const actionHref = reservation.professionalStudioType === "numeria"
    ? createNumeriaStartUrl(reservation.id, customerId, reservation.workspaceId, practitionerUserId)
    : businessAction.href ?? `/app/professional/${professionalApp.studioKey}`;
  const handoffPayload = reservation.professionalStudioType === "numeria"
    ? {
        workspaceId: reservation.workspaceId,
        userId: practitionerUserId,
        sourceApp: "growth-engine",
        reservationId: reservation.id,
        customerRef: { customerId },
        intent: "start_appraisal_session"
      }
    : {
        workspaceId: reservation.workspaceId,
        userId: practitionerUserId,
        sourceApp: "growth-engine",
        visitScheduleId: reservation.id,
        customerRef: { customerId },
        intent: "open_visit_record_context"
      };

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="brand">Growth Engine</h1>
        <nav>
          <div className="nav-group">
            <p className="nav-title">Professional</p>
            <a className="nav-link" href={`/app/professional/${professionalApp.studioKey}`}>{professionalApp.studioName}</a>
          </div>
          <div className="nav-group">
            <p className="nav-title">Business</p>
            {businessMenu.map((item) => (
              <a className={item.key === "reservations" ? "nav-link active" : "nav-link"} href={item.href} key={item.href}>{item.label}</a>
            ))}
          </div>
        </nav>
      </aside>
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / {reservationLabel}詳細</p>
            <h2 className="page-title">{reservationLabel}詳細</h2>
          </div>
          <a className="button secondary" href={`/app/business/reservations?studioKey=${professionalApp.studioKey}`}>一覧へ戻る</a>
        </header>

        <section className="grid">
          <div className="card span-8">
            <h3>{professionalApp.studioName}へ渡す参照情報</h3>
            <dl className="definition-list">
              <dt>予約ID</dt><dd>{reservation.id}</dd>
              <dt>お客様</dt><dd>{customer?.displayName ?? "公開予約のお客様"}</dd>
              <dt>Customer参照ID</dt><dd>{customerId}</dd>
              <dt>メニュー</dt><dd>{product?.name ?? reservation.productId}</dd>
              <dt>日時</dt><dd>{formatDateTime(reservation.scheduledStartAt)}</dd>
              <dt>Professional App</dt><dd>{professionalApp.studioName}</dd>
              <dt>予約状態</dt><dd>{statusLabel(reservation.status)}</dd>
              <dt>支払い状態</dt><dd>{paymentStatusLabel(reservation.paymentStatus)}</dd>
              <dt>流入元</dt><dd>{reservation.sourceChannel ?? "未設定"}</dd>
              <dt>金額</dt><dd>{product ? `${product.price.toLocaleString("ja-JP")} ${product.workspaceId === demoWorkspace.id ? demoWorkspace.currency : ""}` : "未設定"}</dd>
            </dl>
            <div className="action-row">
              <a className="button" href={actionHref}>{businessAction.label}</a>
              {reservation.customerId ? (
                <a className="button secondary" href={`/app/business/customers/${reservation.customerId}`}>
                  お客様詳細
                </a>
              ) : null}
              <a
                className="button secondary"
                href={`/app/business/followups/${followupId}?reservationId=${reservation.id}&customerId=${customerId}`}
              >
                フォローを確認
              </a>
              <a
                className="button secondary"
                href={`/app/business/post-draft-briefs/new?followupId=${followupId}&reservationId=${reservation.id}&customerId=${customerId}`}
              >
                投稿案を依頼
              </a>
              <a
                className="button secondary"
                href={`/app/business/message-draft-briefs/new?followupId=${followupId}&reservationId=${reservation.id}&customerId=${customerId}`}
              >
                連絡文案を依頼
              </a>
            </div>
          </div>

          <div className="card span-4">
            <h3>Professional Appへ渡す内容</h3>
            <pre className="code-block">{JSON.stringify(handoffPayload, null, 2)}</pre>
            <p className="muted">paymentStatus、salesAmount、Stripe情報、顧客マスター全文、機密メモ全文、売上正本、支払い正本は送信しません。</p>
            <div className="divider" />
            <h3>Growth Engineだけで保持</h3>
            <dl className="definition-list compact">
              <dt>支払い状態</dt><dd>{paymentStatusLabel(reservation.paymentStatus)}</dd>
              <dt>売上金額</dt><dd>{product ? `${product.price.toLocaleString("ja-JP")} ${demoWorkspace.currency}` : "未設定"}</dd>
              <dt>正本</dt><dd>Growth Engine</dd>
            </dl>
          </div>
        </section>
      </main>
    </div>
  );
}
