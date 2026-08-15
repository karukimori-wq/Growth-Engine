import { demoWorkspace, products } from "@/lib/mock-data";
import { findCustomer, findReservation } from "@/server/repositories";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    reservationId?: string;
    productId?: string;
    scheduledStartAt?: string;
  }>;
};

function formatReservationDateTime(value?: string) {
  if (!value) {
    return "未指定";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "未指定";
  }

  return date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default async function BookingConfirmedPage({ searchParams }: Props) {
  const params = await searchParams;
  const reservationId = params.reservationId ?? "予約番号未取得";
  const workspaceId = demoWorkspace.id;
  const reservation = params.reservationId
    ? await findReservation(workspaceId, params.reservationId)
    : undefined;
  const customer = reservation?.customerId
    ? await findCustomer(workspaceId, reservation.customerId)
    : undefined;
  const productId = reservation?.productId ?? params.productId;
  const product = products.find((item) => item.workspaceId === workspaceId && item.id === productId);
  const scheduledStartAt = reservation?.scheduledStartAt ?? params.scheduledStartAt;

  return (
    <main className="public-page">
      <section className="public-panel">
        <p className="eyebrow">予約完了</p>
        <h1 className="page-title">予約を受け付けました</h1>
        <p className="muted">
          予約内容を控えてお待ちください。
        </p>
        <div className="divider" />
        <h2>予約内容を控える</h2>
        <dl className="definition-list compact">
          <dt>予約番号</dt>
          <dd>{reservationId}</dd>
          <dt>お名前</dt>
          <dd>{customer?.displayName ?? "予約時に入力したお名前"}</dd>
          <dt>鑑定メニュー</dt>
          <dd>{product?.name ?? "選択した鑑定メニュー"}</dd>
          <dt>希望日時</dt>
          <dd>{formatReservationDateTime(scheduledStartAt)}</dd>
          <dt>受付状態</dt>
          <dd>{reservation ? "Growth Engineの予約として保存済み" : "受付済み"}</dd>
        </dl>
        <div className="action-row">
          <a className="button" href="/public/booking">予約ページへ戻る</a>
          <a className="button secondary" href="/public">トップへ戻る</a>
        </div>
        <p className="muted">
          管理画面の予約確認は担当者ログイン後に利用できます。
        </p>
      </section>
    </main>
  );
}
