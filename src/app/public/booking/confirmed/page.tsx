import { products } from "@/lib/mock-data";

type Props = {
  searchParams: Promise<{
    reservationId?: string;
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
        <p className="muted">
          占い師側では、ログイン後のBusiness画面から予約一覧を確認できます。
        </p>
      </section>
    </main>
  );
}
