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
            </dl>
            <div className="action-row">
              <a className="button" href={actionHref}>{businessAction.label}</a>
              {reservation.customerId ? (
                <a className="button secondary" href={`/app/business/customers/${reservation.customerId}`}>
                  お客様詳細
                </a>
              ) : null}
              <a className="button secondary" href={`/app/business/followups/${mvpFollowupContext.followupId}`}>フォローを確認</a>
              <a
                className="button secondary"
                href={`/app/business/post-draft-briefs/new?followupId=${mvpFollowupContext.followupId}&reservationId=${reservation.id}&customerId=${customerId}`}
              >
                投稿案を依頼
              </a>
              <a
                className="button secondary"
                href={`/app/business/message-draft-briefs/new?followupId=${mvpFollowupContext.followupId}&reservationId=${reservation.id}&customerId=${customerId}`}
              >
                連絡文案を依頼
              </a>
            </div>
          </div>

          <div className="card span-4">
            <h3>Professional Appへ渡す内容</h3>
            <pre className="code-block">{JSON.stringify(handoffPayload, null, 2)}</pre>
            <p className="muted">paymentStatus、salesAmount、Stripe情報、顧客マスター全文、機密メモ全文、売上正本、支払い正本は送信しません。</p>
          </div>
        </section>
      </main>
    </div>
  );
}
