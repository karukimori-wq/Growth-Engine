import { demoWorkspace } from "@/lib/mock-data";
import { getBusinessMetrics, formatCurrency } from "@/server/business-metrics";
import { BusinessSidebar } from "../_components/business-sidebar";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function matchesText(value: string | undefined, query: string) {
  return value?.toLowerCase().includes(query.toLowerCase()) ?? false;
}

export default async function CustomersPage({ searchParams: _searchParams }: Props) {
  const query = await _searchParams;
  const metrics = await getBusinessMetrics(demoWorkspace.id);
  const statusFilter = first(query.status) ?? "all";
  const sourceFilter = first(query.sourceChannel) ?? "all";
  const segmentFilter = first(query.segment) ?? "all";
  const searchQuery = first(query.q)?.trim() ?? "";
  const sourceOptions = Array.from(
    new Set(metrics.customerSales.map(({ customer }) => customer.sourceChannel ?? "unknown"))
  ).sort();
  const visibleCustomers = metrics.customerSales.filter(({ customer, paidAmount, paidCount, latestReservation }) => {
    const statusMatches = statusFilter === "all" || customer.customerStatus === statusFilter;
    const sourceMatches = sourceFilter === "all" || (customer.sourceChannel ?? "unknown") === sourceFilter;
    const segmentMatches =
      segmentFilter === "all" ||
      (segmentFilter === "repeat" && paidCount >= 2) ||
      (segmentFilter === "active" && Boolean(latestReservation)) ||
      (segmentFilter === "sales" && paidAmount > 0) ||
      (segmentFilter === "no_sales" && paidAmount === 0);
    const textMatches =
      searchQuery.length === 0 ||
      matchesText(customer.id, searchQuery) ||
      matchesText(customer.customerNumber, searchQuery) ||
      matchesText(customer.displayName, searchQuery) ||
      matchesText(customer.sourceChannel, searchQuery);

    return statusMatches && sourceMatches && segmentMatches && textMatches;
  });

  return (
    <div className="shell">
      <BusinessSidebar activeKey="customers" />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / お客様</p>
            <h2 className="page-title">お客様一覧</h2>
          </div>
          <a className="button secondary" href="/app/business/reservations">
            予約を確認
          </a>
        </header>

        <section className="card">
          <form className="filter-bar">
            <label className="field-label compact">
              検索
              <input name="q" placeholder="顧客名・顧客番号・流入元" defaultValue={searchQuery} />
            </label>
            <label className="field-label compact">
              状態
              <select name="status" defaultValue={statusFilter}>
                <option value="all">すべて</option>
                <option value="active">有効</option>
                <option value="inactive">休眠</option>
                <option value="blocked">停止</option>
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
            <label className="field-label compact">
              セグメント
              <select name="segment" defaultValue={segmentFilter}>
                <option value="all">すべて</option>
                <option value="repeat">リピート済み</option>
                <option value="active">予約あり</option>
                <option value="sales">売上あり</option>
                <option value="no_sales">売上なし</option>
              </select>
            </label>
            <button className="button" type="submit">絞り込み</button>
            <a className="button secondary" href="/app/business/customers">リセット</a>
          </form>
          <p className="muted">表示 {visibleCustomers.length}件 / 全{metrics.customerSales.length}件</p>
          <div className="table-list">
            {metrics.customerSales.length > 0 && visibleCustomers.length === 0 ? (
              <div className="row-link">
                <span>
                  <strong>条件に合うお客様はありません</strong>
                  <br />
                  <span className="muted">検索語、状態、流入元、セグメントを変更してください。</span>
                </span>
              </div>
            ) : null}
            {visibleCustomers.map(({ customer, paidAmount, paidCount, latestReservation }) => (
              <a className="row-link" href={`/app/business/customers/${customer.id}`} key={customer.id}>
                <span>
                  <strong>{customer.displayName}</strong>
                  <br />
                  <span className="muted">
                    {customer.customerNumber} / 売上 {formatCurrency(paidAmount, demoWorkspace.currency)} / 支払い済み {paidCount}件
                    {latestReservation ? ` / 次回 ${new Date(latestReservation.scheduledStartAt).toLocaleString("ja-JP")}` : ""}
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
