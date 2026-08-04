import Link from "next/link";

export default function Page() {
  return (
    <main className="main">
      <section className="card">
        <p className="eyebrow">Growth Engine</p>
        <h1 className="page-title">Businessプランで使う集客・販売・フォロー基盤</h1>
        <p className="muted">
          Growth Engineは内部名称です。ユーザー画面では「今日やること」「集客」「お客様」「予約」「売上」などの言葉で表示します。
        </p>
        <Link className="badge" href="/app/business">
          Businessホームを開く
        </Link>
      </section>
    </main>
  );
}
