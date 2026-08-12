import { demoWorkspace, insights, todayReservations } from "@/lib/mock-data";
import { createPostDraftBriefUrl, mvpFollowupContext } from "@/lib/screen-flow";
import { getBusinessMenu, getProfessionalApp, professionalApps } from "@/lib/professional-app-registry";
import { canAccessBusiness } from "@/lib/plan";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function withStudioKey(href: string, studioKey: string) {
  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);

  params.set("studioKey", studioKey);

  return `${pathname}?${params.toString()}`;
}

export default async function BusinessHomePage({ searchParams }: Props) {
  const query = await searchParams;
  const currentProfessionalApp = getProfessionalApp(first(query.studioKey) ?? demoWorkspace.professionalStudioType);
  const businessMenu = getBusinessMenu(currentProfessionalApp.studioKey);
  const hasBusinessAccess = canAccessBusiness(demoWorkspace.plan);
  const isVelvet = currentProfessionalApp.studioKey === "velvet";
  const tasks = [
    { label: isVelvet ? "今日連絡すべき顧客" : "LINE返信が必要な見込み客", value: "3名", href: "/app/business/prospects", tone: "warning" },
    { label: isVelvet ? "本日の来店予定" : "本日の予約", value: "2件", href: "/app/business/reservations", tone: "default" },
    { label: isVelvet ? "再来店フォロー対象" : "鑑定後フォロー対象", value: "1件", href: `/app/business/followups/${mvpFollowupContext.followupId}`, tone: "default" },
    { label: isVelvet ? "SNS Plannerへ送る連絡施策ブリーフ" : "SNS Plannerへ送る投稿ブリーフ", value: "1件", href: createPostDraftBriefUrl(mvpFollowupContext.followupId), tone: "default" }
  ];

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
        <h1 className="brand">{currentProfessionalApp.studioName}</h1>
        <nav>
          <div className="nav-group">
            <p className="nav-title">Professional</p>
            {currentProfessionalApp.professionalMenu.map((item) => (
              <a className="nav-link" href={item.href} key={item.href}>{item.label}</a>
            ))}
          </div>
          <div className="nav-group">
            <p className="nav-title">Business</p>
            {businessMenu.map((item) => (
              <a className={item.key === "today" ? "nav-link active" : "nav-link"} href={item.href} key={item.href}>{item.label}</a>
            ))}
          </div>
          <div className="nav-group">
            <p className="nav-title">Professional App</p>
            {professionalApps.map((item) => (
              <a className={item.studioKey === currentProfessionalApp.studioKey ? "nav-link active" : "nav-link"} href={`/app/professional/${item.studioKey}`} key={item.studioKey}>{item.studioName}</a>
            ))}
          </div>
          <div className="nav-group">
            <p className="nav-title">管理者向け</p>
            <a className="nav-link" href="/app/business/reservations">予約確認</a>
          </div>
        </nav>
      </aside>
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / Business共通</p>
            <h2 className="page-title">今日やること</h2>
          </div>
          <span className="badge">Businessプラン</span>
        </header>

        <section className="grid">
          <div className="card span-4">
            <p className="muted">{isVelvet ? "今月の来店売上" : "今月の売上"}</p>
            <p className="metric">¥186,000</p>
          </div>
          <div className="card span-4">
            <p className="muted">今月の新規顧客</p>
            <p className="metric">12名</p>
          </div>
          <div className="card span-4">
            <p className="muted">{isVelvet ? "今月の再来店" : "今月のリピート"}</p>
            <p className="metric">7件</p>
          </div>

          <div className="card span-8">
            <h3>優先タスク</h3>
            <ul className="task-list">
              {tasks.map((task) => (
                <li className="task" key={task.label}>
                  <a className="task-main" href={withStudioKey(task.href, currentProfessionalApp.studioKey)}>{task.label}</a>
                  <span className={`badge ${task.tone === "warning" ? "warning" : ""}`}>{task.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card span-4">
            <h3>{isVelvet ? "今日の来店予定" : "今日の予約"}</h3>
            <ul className="task-list">
              {todayReservations.map((reservation) => (
                <li className="task" key={reservation.id}>
                  <a className="task-main" href={`/app/business/reservations/${reservation.id}?studioKey=${currentProfessionalApp.studioKey}`}>
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
                  <a className={`badge ${insight.priority === "high" ? "warning" : ""}`} href={withStudioKey(createPostDraftBriefUrl(mvpFollowupContext.followupId), currentProfessionalApp.studioKey)}>{insight.priority}</a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
