export default function PublicHomePage() {
  return (
    <main className="public-page">
      <section className="public-panel">
        <p className="eyebrow">Numeria Studio</p>
        <h1 className="page-title">数秘術鑑定の予約</h1>
        <p className="muted">
          鑑定を希望する方は予約ページへ進んでください。管理画面は担当者ログイン後に利用できます。
        </p>
        <div className="action-row">
          <a className="button" href="/public/booking">予約する</a>
        </div>
      </section>
    </main>
  );
}
