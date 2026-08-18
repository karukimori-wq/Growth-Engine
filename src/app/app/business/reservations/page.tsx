import { demoWorkspace } from "@/lib/mock-data";
import { getBusinessMenu, getBusinessMenuLabel, getProfessionalApp } from "@/lib/professional-app-registry";
import { listBusinessReservations } from "@/server/business-reservations";
import { checkPostgresHealth } from "@/server/postgres-health";

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

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function matchesText(value: string | undefined, query: string) {
  return value?.toLowerCase().includes(query.toLowerCase()) ?? false;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    requested: "受付済み",
    confirmed: "確定",
    cancelled: "キャンセル",
    completed: "完了",
    no_show: "無断キャンセル"
  };

  return labels[status] ?? status;
}

function paymentStatusLabel(status: string | undefined) {
  const labels: Record<string, string> = {
    unpaid: "未払い",
    paid: "支払い済み",
    refunded: "返金済み",
    cancelled: "キャンセル"
  };

  return labels[status ?? ""] ?? "未設定";
}

export default async function ReservationsPage({ searchParams: _searchParams }: Props) {
  const query = await _searchParams;
  const currentProfessionalApp = getProfessionalApp(first(query.studioKey) ?? demoWorkspace.professionalStudioType);
  const businessMenu = getBusinessMenu(currentProfessionalApp.studioKey);
  const reservationLabel = getBusinessMenuLabel("reservations", currentProfessionalApp.studioKey);
  const postgresHealth = await checkPostgresHealth();
  const databaseBackedPersistenceReady = postgresHealth.databaseBackedPersistenceReady;
  const records = await listBusinessReservations(demoWorkspace.id);
  const statusFilter = first(query.status) ?? "all";
  const paymentFilter = first(query.paymentStatus) ?? "all";
  const sourceFilter = first(query.sourceChannel) ?? "all";
  const searchQuery = first(query.q)?.trim() ?? "";
  const visibleRecords = records.filter(({ reservation, customer, product }) => {
    const statusMatches = statusFilter === "all" || reservation.status === statusFilter;
    const paymentMatches = paymentFilter === "all" || reservation.paymentStatus === paymentFilter;
    const sourceMatches = sourceFilter === "all" || (reservation.sourceChannel ?? "unknown") === sourceFilter;
    const textMatches =
      searchQuery.length === 0 ||
      matchesText(reservation.id, searchQuery) ||
      matchesText(reservation.customerId, searchQuery) ||
      matchesText(customer?.displayName, searchQuery) ||
      matchesText(product?.name, searchQuery);

    return statusMatches && paymentMatches && sourceMatches && textMatches;
  });
  const sourceOptions = Array.from(
    new Set(records.map(({ reservation }) => reservation.sourceChannel ?? "unknown"))
  ).sort();

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
              <a className={item.key === "reservations" ? "nav-link active" : "nav-link"} href={item.href} key={item.href}>{item.label}</a>
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
            <p className="eyebrow">Growth Engine / {reservationLabel}</p>
            <h2 className="page-title">{reservationLabel}一覧</h2>
          </div>
          <a className="button" href="/public/booking">一般顧客向け予約ページ</a>
        </header>

        {!databaseBackedPersistenceReady ? (
          <section className="card">
            <p className="eyebrow">保存設定の確認が必要</p>
            <h3>本番DB保存がまだ有効ではありません</h3>
            <p className="muted">
              現在は {postgresHealth.repositoryDriver} repository で動作しています。公開予約は受け付けられますが、別端末・別ブラウザ・再ログイン後の予約一覧表示は保証できません。
            </p>
            <p className="muted">
              Vercel Production に <code>GROWTH_REPOSITORY_DRIVER=postgres</code> と Postgres 接続envを設定し、redeploy後に <code>/api/persistence/status</code> を確認してください。
            </p>
            {postgresHealth.issue ? <p className="muted">現在の確認結果: {postgresHealth.issue}</p> : null}
          </section>
        ) : null}

        <section className="card">
          <form className="filter-bar">
            <input type="hidden" name="studioKey" value={currentProfessionalApp.studioKey} />
            <label className="field-label compact">
              検索
              <input name="q" placeholder="予約ID・顧客・メニュー" defaultValue={searchQuery} />
            </label>
            <label className="field-label compact">
              予約状態
              <select name="status" defaultValue={statusFilter}>
                <option value="all">すべて</option>
                <option value="requested">受付済み</option>
                <option value="confirmed">確定</option>
                <option value="cancelled">キャンセル</option>
                <option value="completed">完了</option>
                <option value="no_show">無断キャンセル</option>
              </select>
            </label>
            <label className="field-label compact">
              支払い状態
              <select name="paymentStatus" defaultValue={paymentFilter}>
                <option value="all">すべて</option>
                <option value="unpaid">未払い</option>
                <option value="paid">支払い済み</option>
                <option value="refunded">返金済み</option>
              </select>
            </label>
            <label className="field-label compact">
              流入元
              <select name="sourceChannel" defaultValue={sourceFilter}>
                <option value="all">すべて</option>
                {sourceOptions.map((source) => (
                  <option value={source} key={source}>
                    {source === "unknown" ? "未設定" : source}
                  </option>
                ))}
              </select>
            </label>
            <button className="button" type="submit">絞り込み</button>
            <a className="button secondary" href={`/app/business/reservations?studioKey=${currentProfessionalApp.studioKey}`}>
              リセット
            </a>
          </form>
          <p className="muted">表示 {visibleRecords.length}件 / 全{records.length}件</p>
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
            {records.length > 0 && visibleRecords.length === 0 ? (
              <div className="row-link">
                <span>
                  <strong>条件に合う予約はありません</strong>
                  <br />
                  <span className="muted">検索語、予約状態、支払い状態、流入元を変更してください。</span>
                </span>
              </div>
            ) : null}
            {visibleRecords.map(({ reservation, customer, product }) => (
              <a
                className="row-link"
                href={`/app/business/reservations/${reservation.id}?studioKey=${currentProfessionalApp.studioKey}`}
                key={reservation.id}
              >
                <span>
                  <strong>{formatTime(reservation.scheduledStartAt)}</strong>
                  <br />
                  <span className="muted">
                    {customer?.displayName ?? reservation.customerId ?? "公開予約のお客様"} /{" "}
                    {product?.name ?? reservation.productId}
                  </span>
                  <br />
                  <span className="muted">
                    {statusLabel(reservation.status)} / {paymentStatusLabel(reservation.paymentStatus)} /{" "}
                    {reservation.sourceChannel ?? "流入元未設定"}
                  </span>
                </span>
                <span className="badge">{paymentStatusLabel(reservation.paymentStatus)}</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
