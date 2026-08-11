import { products } from "@/lib/mock-data";

type Props = {
  searchParams: Promise<{
    reservationId?: string;
    workspaceId?: string;
    ownerUserId?: string;
    customerId?: string;
    productId?: string;
    scheduledStartAt?: string;
    scheduledEndAt?: string;
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
  const product = products.find((item) => item.id === params.productId);

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
          <dt>鑑定メニュー</dt>
          <dd>{product?.name ?? "選択した鑑定メニュー"}</dd>
          <dt>希望日時</dt>
          <dd>{formatReservationDateTime(params.scheduledStartAt)}</dd>
          <dt>ワークスペースID</dt>
          <dd>{params.workspaceId ?? "未取得"}</dd>
          <dt>担当者ID</dt>
          <dd>{params.ownerUserId ?? "未取得"}</dd>
        </dl>
        <div className="action-row">
          <a className="button" href="/public/booking">予約ページへ戻る</a>
          <a className="button secondary" href="/app/business">トップへ戻る</a>
        </div>
        <p className="muted">
          管理画面の予約確認は担当者ログイン後に利用できます。
        </p>
      </section>
    </main>
  );
}
