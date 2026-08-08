import { demoWorkspace, insights, todayReservations } from "@/lib/mock-data";
import { createPostDraftBriefUrl, mvpFollowupContext } from "@/lib/screen-flow";
import { canAccessBusiness } from "@/lib/plan";

const tasks = [
  { label: "LINE返信が必要な見込み客", value: "3名", href: "/app/business/leads", tone: "warning" },
  { label: "本日の予約", value: "2件", href: "/app/business/reservations", tone: "default" },
  { label: "鑑定後フォロー対象", value: "1件", href: `/app/business/followups/${mvpFollowupContext.followupId}`, tone: "default" },
  { label: "SNS Plannerへ送る投稿ブリーフ", value: "1件", href: createPostDraftBriefUrl(mvpFollowupContext.followupId), tone: "default" }
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
            <a className="nav-link" href="/app/business/customers">顧客</a>
            <a className="nav-link" href="/app/business/reservations/res_001">新しい鑑定</a>
            <a className="nav-link" href="/app/business/followups/followup_res_001_post_session">鑑定履歴</a>
          </div>
          <div className="nav-group">
            <p className="nav-title">Business</p>
            <a className="nav-link active" href="/app/business">今日やること</a>
            <a className="nav-link" href="/app/business/post-draft-briefs/new">集客</a>
            <a className="nav-link" href="/app/business/leads">見込み客</a>
            <a className="nav-link" href="/app/business/reservations">予約</a>
            <a className="nav-link" href="/app/business/sales">売上</a>
            <a className="nav-link" href="/app/business/followups/followup_res_001_post_session">リピート</a>
            <a className="nav-link" href="/app/business/referrals">紹介</a>
            <a className="nav-link" href="/app/business/analytics">分析</a>
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
                  <a className="task-main" href={task.href}>{task.label}</a>
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
                  <a className="task-main" href={`/app/business/reservations/${reservation.id}`}>
                    {new Date(reservation.scheduledStartAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                  </a>
                  <span className="badge">詳細へ</span>
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
                  <a className={`badge ${insight.priority === "high" ? "warning" : ""}`} href={createPostDraftBriefUrl(mvpFollowupContext.followupId)}>{insight.priority}</a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
