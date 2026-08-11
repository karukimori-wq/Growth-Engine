type Props = {
  searchParams: Promise<{
    reservationId?: string;
    workspaceId?: string;
    ownerUserId?: string;
  }>;
};

export default async function BookingConfirmedPage({ searchParams }: Props) {
  const params = await searchParams;
  const reservationId = params.reservationId ?? "reservation_reference_missing";
  const reservationDetailHref = `/app/business/reservations/${reservationId}`;

  return (
    <main className="public-page">
      <section className="public-panel">
        <p className="eyebrow">一般顧客向け</p>
        <h1 className="page-title">予約を受け付けました</h1>
        <p className="muted">
          予約内容を控えてお待ちください。占い師側ではBusiness画面の予約一覧から確認できます。
        </p>
        <div className="divider" />
        <dl className="definition-list compact">
          <dt>reservationId</dt>
          <dd>{reservationId}</dd>
          <dt>workspaceId</dt>
          <dd>{params.workspaceId ?? "workspace_reference_missing"}</dd>
          <dt>ownerUserId</dt>
          <dd>{params.ownerUserId ?? "owner_reference_missing"}</dd>
        </dl>
        <div className="action-row">
          <a className="button" href="/public/booking">別の予約をする</a>
          <a className="button secondary" href="/app/business/reservations">占い師として予約一覧を確認</a>
          <a className="button secondary" href={reservationDetailHref}>この予約を確認</a>
        </div>
        <p className="muted">
          予約一覧と予約詳細は占い師ログイン後に表示されます。一般顧客はBusiness管理画面には入れません。
        </p>
      </section>
    </main>
  );
}
