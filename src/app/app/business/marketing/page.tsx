export default function MarketingPage() {
  return (
    <main className="main">
      <section className="card">
        <p className="eyebrow">Business</p>
        <h1 className="page-title">集客</h1>
        <dl className="definition-list compact">
          <dt>status</dt>
          <dd>coming_soon</dd>
          <dt>message</dt>
          <dd>MVPでは準備中です</dd>
        </dl>
        <div className="action-row">
          <a className="button" href="/app/business/post-draft-briefs/new">投稿案を依頼する</a>
          <a className="button secondary" href="/app/business">ホームへ戻る</a>
        </div>
      </section>
    </main>
  );
}
