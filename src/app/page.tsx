import Link from "next/link";

export default function Page() {
  return (
    <main className="main">
      <section className="card">
        <p className="eyebrow">Numeria Studio</p>
        <h1 className="page-title">数秘術鑑定の予約</h1>
        <p className="muted">
          鑑定を希望する方は予約ページへ進んでください。管理画面は担当者ログイン後に利用できます。
        </p>
        <div className="action-row">
          <Link className="badge" href="/public/booking">
            予約する
          </Link>
          <Link className="button secondary" href="/app/sign-in">
            担当者ログイン
          </Link>
        </div>
      </section>
    </main>
  );
}
