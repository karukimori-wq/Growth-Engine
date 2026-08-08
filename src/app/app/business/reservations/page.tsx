import { customers, products, todayReservations } from "@/lib/mock-data";

function formatTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function ReservationsPage() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="brand">Numeria Studio</h1>
        <nav>
          <div className="nav-group">
            <p className="nav-title">Business</p>
            <a className="nav-link" href="/app/business">今日やること</a>
            <a className="nav-link active" href="/app/business/reservations">予約</a>
            <a className="nav-link" href="/app/business/post-draft-briefs/new">集客</a>
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
            <p className="eyebrow">Business / 予約</p>
            <h2 className="page-title">予約一覧</h2>
          </div>
          <a className="button" href="/public/booking">一般顧客向け予約ページ</a>
        </header>

        <section className="card">
          <div className="table-list">
            {todayReservations.map((reservation) => {
              const customer = customers.find((item) => item.id === reservation.customerId);
              const product = products.find((item) => item.id === reservation.productId);

              return (
                <a className="row-link" href={`/app/business/reservations/${reservation.id}`} key={reservation.id}>
                  <span>
                    <strong>{formatTime(reservation.scheduledStartAt)}</strong>
                    <br />
                    <span className="muted">{customer?.displayName ?? reservation.customerId} / {product?.name ?? reservation.productId}</span>
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
