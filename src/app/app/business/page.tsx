import { demoWorkspace, insights, todayReservations } from "@/lib/mock-data";
import { canAccessBusiness } from "@/lib/plan";

const tasks = [
  { label: "LINE返信が必要な見込み客", value: "3名", tone: "warning" },
  { label: "本日の予約", value: "2件", tone: "default" },
  { label: "鑑定後フォロー対象", value: "4名", tone: "default" },
  { label: "SNS Plannerへ送る投稿ブリーフ", value: "1件", tone: "default" }
];

export default function BusinessHomePage() {
  const hasBusinessAccess = canAccessBusiness(demoWorkspace.plan);

  if (!hasBusinessAccess) {
    return (
      <main className="main">
        <section className="card">
          <h1 className="page-title">Business機能</h1>
          <p className="muted">この機能を利用するにはBusinessプランが必要です。</p>
        </section>
      </main>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="brand">Numeria Studio</h1>
        <nav>
          <div className="nav-group">
            <p className="nav-title">Professional</p>
            <a className="nav-link" href="#">顧客</a>
            <a className="nav-link" href="#">新しい鑑定</a>
            <a className="nav-link" href="#">鑑定履歴</a>
          </div>
          <div className="nav-group">
            <p className="nav-title">Business</p>
            <a className="nav-link active" href="#">今日やること</a>
            <a className="nav-link" href="#">集客</a>
            <a className="nav-link" href="#">見込み客</a>
            <a className="nav-link" href="#">予約</a>
            <a className="nav-link" href="#">売上</a>
            <a className="nav-link" href="#">リピート</a>
            <a className="nav-link" href="#">紹介</a>
            <a className="nav-link" href="#">分析</a>
          </div>
        </nav>
      </aside>
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Businessホーム</p>
            <h2 className="page-title">今日やること</h2>
          </div>
          <span className="badge">Businessプラン</span>
        </header>

        <section className="grid">
          <div className="card span-4">
            <p className="muted">今月の売上</p>
            <p className="metric">¥186,000</p>
          </div>
          <div className="card span-4">
            <p className="muted">今月の新規顧客</p>
            <p className="metric">12名</p>
          </div>
          <div className="card span-4">
            <p className="muted">今月のリピート</p>
            <p className="metric">7件</p>
          </div>

          <div className="card span-8">
            <h3>優先タスク</h3>
            <ul className="task-list">
              {tasks.map((task) => (
                <li className="task" key={task.label}>
                  <span>{task.label}</span>
                  <span className={`badge ${task.tone === "warning" ? "warning" : ""}`}>{task.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card span-4">
            <h3>今日の予約</h3>
            <ul className="task-list">
              {todayReservations.map((reservation) => (
                <li className="task" key={reservation.id}>
                  <span>{new Date(reservation.scheduledStartAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="badge">{reservation.paymentStatus === "paid" ? "支払済" : "未払い"}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card span-12">
            <h3>AIからの提案</h3>
            <ul className="task-list">
              {insights.map((insight) => (
                <li className="task" key={insight.id}>
                  <span>
                    <strong>{insight.title}</strong>
                    <br />
                    <span className="muted">{insight.summary}</span>
                  </span>
                  <span className={`badge ${insight.priority === "high" ? "warning" : ""}`}>{insight.priority}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
