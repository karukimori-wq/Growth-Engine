export default function SalesPage() {
  return (
    <main className="main">
      <section className="card">
        <p className="eyebrow">Business</p>
        <h1 className="page-title">売上</h1>
        <dl className="definition-list compact">
          <dt>status</dt>
          <dd>coming_soon</dd>
          <dt>message</dt>
          <dd>MVPでは準備中です</dd>
        </dl>
        <div className="action-row">
          <a className="button" href="/app/business">ホームへ戻る</a>
        </div>
      </section>
    </main>
  );
}
