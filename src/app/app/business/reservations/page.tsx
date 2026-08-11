import { demoWorkspace } from "@/lib/mock-data";
import { businessMenu, getProfessionalApp } from "@/lib/professional-app-registry";
import { listBusinessReservations } from "@/server/business-reservations";
import { createReservationFromReference } from "@/server/public-reservation-store";

type Props = {
  searchParams: Promise<{
    reservationId?: string;
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

function formatTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default async function ReservationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentProfessionalApp = getProfessionalApp(demoWorkspace.professionalStudioType);
  const fallbackReservation = createReservationFromReference(params);
  const records = await listBusinessReservations(
    demoWorkspace.id,
    fallbackReservation ? [fallbackReservation] : []
  );

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
            {records.map(({ reservation, customer, product }) => {
              const detailParams = new URLSearchParams({
                reservationId: reservation.id,
                workspaceId: reservation.workspaceId,
                customerId: reservation.customerId ?? "",
                productId: reservation.productId,
                scheduledStartAt: reservation.scheduledStartAt,
                scheduledEndAt: reservation.scheduledEndAt,
                sourceChannel: reservation.sourceChannel ?? "public_booking",
                createdAt: reservation.createdAt,
                updatedAt: reservation.updatedAt
              });

              return (
                <a
                  className="row-link"
                  href={`/app/business/reservations/${reservation.id}?${detailParams.toString()}`}
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
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
