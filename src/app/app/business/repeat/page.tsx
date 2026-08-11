export default function RepeatPage() {
  return (
    <main className="main">
      <section className="card">
        <p className="eyebrow">Business</p>
        <h1 className="page-title">リピート</h1>
        <dl className="definition-list compact">
          <dt>status</dt>
          <dd>coming_soon</dd>
          <dt>message</dt>
          <dd>MVPでは準備中です</dd>
        </dl>
        <div className="action-row">
          <a className="button" href="/app/business/followups/followup_res_001_post_session">フォローを確認</a>
          <a className="button secondary" href="/app/business">ホームへ戻る</a>
        </div>
      </section>
    </main>
  );
}
