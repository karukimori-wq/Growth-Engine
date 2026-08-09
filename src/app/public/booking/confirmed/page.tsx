type Props = {
  searchParams: Promise<{
    reservationId?: string;
    workspaceId?: string;
    ownerUserId?: string;
  }>;
};

export default async function BookingConfirmedPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="public-page">
      <section className="public-panel">
        <p className="eyebrow">一般顧客向け</p>
        <h1 className="page-title">予約を受け付けました</h1>
        <p className="muted">
          予約はGrowth EngineのReservation正本として作成されました。管理画面への導線は表示しません。
        </p>
        <div className="divider" />
        <dl className="definition-list compact">
          <dt>reservationId</dt>
          <dd>{params.reservationId ?? "reservation_reference_missing"}</dd>
          <dt>workspaceId</dt>
          <dd>{params.workspaceId ?? "workspace_reference_missing"}</dd>
          <dt>ownerUserId</dt>
          <dd>{params.ownerUserId ?? "owner_reference_missing"}</dd>
        </dl>
      </section>
    </main>
  );
}
