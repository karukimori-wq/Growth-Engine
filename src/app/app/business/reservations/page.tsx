import { demoWorkspace } from "@/lib/mock-data";
import { businessMenu, getProfessionalApp } from "@/lib/professional-app-registry";
import { listBusinessReservations } from "@/server/business-reservations";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default async function ReservationsPage({ searchParams: _searchParams }: Props) {
  await _searchParams;

  const currentProfessionalApp = getProfessionalApp(demoWorkspace.professionalStudioType);
  const records = await listBusinessReservations(demoWorkspace.id);

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="brand">Growth Engine</h1>
        <nav>
          <div className="nav-group">
            <p className="nav-title">Professional</p>
            <a className="nav-link" href={`/app/professional/${currentProfessionalApp.studioKey}`}>{currentProfessionalApp.studioName}</a>
          </div>
          <div className="nav-group">
            <p className="nav-title">Business</p>
            {businessMenu.map((item) => (
              <a className={item.href === "/app/business/reservations" ? "nav-link active" : "nav-link"} href={item.href} key={item.href}>{item.label}</a>
            ))}
          </div>
          <div className="nav-group">
            <p className="nav-title">一般顧客向け</p>
            <a className="nav-link" href="/public/booking">予約ページ確認</a>
          </div>
        </nav>
      </aside>
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / 予約</p>
            <h2 className="page-title">予約一覧</h2>
          </div>
          <a className="button" href="/public/booking">一般顧客向け予約ページ</a>
        </header>

        <section className="card">
          <div className="table-list">
            {records.length === 0 ? (
              <div className="row-link">
                <span>
                  <strong>予約はまだありません</strong>
                  <br />
                  <span className="muted">公開予約ページから作成された予約がここに表示されます。</span>
                </span>
              </div>
            ) : null}
            {records.map(({ reservation, customer, product }) => (
              <a
                className="row-link"
                href={`/app/business/reservations/${reservation.id}`}
                key={reservation.id}
              >
                <span>
                  <strong>{formatTime(reservation.scheduledStartAt)}</strong>
                  <br />
                  <span className="muted">
                    {customer?.displayName ?? reservation.customerId ?? "公開予約のお客様"} /{" "}
                    {product?.name ?? reservation.productId}
                  </span>
                </span>
                <span className="badge">詳細</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
