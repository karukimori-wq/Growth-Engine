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
    sourceChannel?: string;
    createdAt?: string;
    updatedAt?: string;
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
  const referenceParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      referenceParams.set(key, value);
    }
  }

  const referenceQuery = referenceParams.toString();
  const reservationListHref = referenceQuery
    ? `/app/business/reservations?${referenceQuery}`
    : "/app/business/reservations";
  const reservationDetailHref = referenceQuery
    ? `/app/business/reservations/${reservationId}?${referenceQuery}`
    : `/app/business/reservations/${reservationId}`;

  return (
    <main className="public-page">
      <section className="public-panel">
        <p className="eyebrow">一般顧客向け</p>
        <h1 className="page-title">予約を受け付けました</h1>
        <p className="muted">
          以下の内容で予約を受け付けました。必要に応じて予約番号を控えてください。
        </p>
        <div className="divider" />
        <dl className="definition-list compact">
          <dt>予約番号</dt>
          <dd>{reservationId}</dd>
          <dt>鑑定メニュー</dt>
          <dd>{product?.name ?? "選択した鑑定メニュー"}</dd>
          <dt>希望日時</dt>
          <dd>{formatReservationDateTime(params.scheduledStartAt)}</dd>
        </dl>
        <div className="action-row">
          <a className="button" href="/">ホームへ戻る</a>
        </div>
        <div className="divider" />
        <p className="muted">
          占い師はログイン後、Business画面でこの予約を確認できます。一般顧客はBusiness管理画面には入れません。
        </p>
        <div className="action-row">
          <a className="button secondary" href={reservationListHref}>占い師用：予約一覧で確認</a>
          <a className="button secondary" href={reservationDetailHref}>占い師用：この予約を開く</a>
        </div>
      </section>
    </main>
  );
}
