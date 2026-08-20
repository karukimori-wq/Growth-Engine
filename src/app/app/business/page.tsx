import { demoWorkspace, insights } from "@/lib/mock-data";
import { createPostDraftBriefUrl, mvpFollowupContext } from "@/lib/screen-flow";
import { getBusinessMenuLabel, getProfessionalApp } from "@/lib/professional-app-registry";
import { canAccessBusiness } from "@/lib/plan";
import { listBusinessReservations } from "@/server/business-reservations";
import { getBusinessMetrics } from "@/server/business-metrics";
import { BusinessSidebar } from "./_components/business-sidebar";

export const dynamic = "force-dynamic";

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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: demoWorkspace.currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function isTodayInWorkspace(value: string) {
  const date = new Date(value);
  const today = new Date();
  const options = {
    timeZone: demoWorkspace.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  } as const;

  return date.toLocaleDateString("ja-JP", options) === today.toLocaleDateString("ja-JP", options);
}

export default async function BusinessHomePage({ searchParams }: Props) {
  const query = await searchParams;
  const currentProfessionalApp = getProfessionalApp(first(query.studioKey) ?? demoWorkspace.professionalStudioType);
  const hasBusinessAccess = canAccessBusiness(demoWorkspace.plan);
  const isVelvet = currentProfessionalApp.studioKey === "velvet";
  const reservationLabel = getBusinessMenuLabel("reservations", currentProfessionalApp.studioKey);
  const repeatLabel = getBusinessMenuLabel("repeat", currentProfessionalApp.studioKey);
  const salesLabel = getBusinessMenuLabel("sales", currentProfessionalApp.studioKey);
  const [reservationRecords, metrics] = await Promise.all([
    listBusinessReservations(demoWorkspace.id),
    getBusinessMetrics(demoWorkspace.id)
  ]);
  const todaysReservationRecords = reservationRecords
    .filter(({ reservation }) => isTodayInWorkspace(reservation.scheduledStartAt))
    .sort((left, right) => (
      new Date(left.reservation.scheduledStartAt).getTime() -
      new Date(right.reservation.scheduledStartAt).getTime()
    ))
    .slice(0, 5);
  const openFollowupCount = reservationRecords.filter(({ reservation }) => (
    reservation.status === "completed" || reservation.status === "confirmed"
  )).length;
  const tasks = [
    { label: isVelvet ? "今日連絡すべき顧客" : "LINE返信が必要な見込み客", value: "確認", href: "/app/business/prospects", tone: "warning" },
    { label: isVelvet ? "本日の来店予定" : "本日の予約", value: `${todaysReservationRecords.length}件`, href: "/app/business/reservations", tone: "default" },
    { label: isVelvet ? "再来店フォロー対象" : "鑑定後フォロー対象", value: `${openFollowupCount}件`, href: `/app/business/followups/${mvpFollowupContext.followupId}`, tone: "default" },
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
      <BusinessSidebar activeKey="today" studioKey={currentProfessionalApp.studioKey} />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / {currentProfessionalApp.studioName}</p>
            <h2 className="page-title">今日やること</h2>
          </div>
          <span className="badge">Businessプラン</span>
        </header>

        <section className="grid">
          <div className="card span-4">
            <p className="muted">今月の{salesLabel}</p>
            <p className="metric">{formatCurrency(metrics.paidSalesAmount)}</p>
          </div>
          <div className="card span-4">
            <p className="muted">今月の新規顧客</p>
            <p className="metric">{metrics.customers.length}名</p>
          </div>
          <div className="card span-4">
            <p className="muted">今月の{repeatLabel}</p>
            <p className="metric">{metrics.repeatCandidateCount}件</p>
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
            <h3>今日の{reservationLabel}</h3>
            <ul className="task-list">
              {todaysReservationRecords.map(({ reservation, customer, product }) => (
                <li className="task" key={reservation.id}>
                  <a className="task-main" href={`/app/business/reservations/${reservation.id}?studioKey=${currentProfessionalApp.studioKey}`}>
                    {formatTime(reservation.scheduledStartAt)}
                    <br />
                    <span className="muted">{customer?.displayName ?? "公開予約のお客様"} / {product?.name ?? reservation.productId}</span>
                  </a>
                  <span className="badge">詳細へ</span>
                </li>
              ))}
              {todaysReservationRecords.length === 0 ? (
                <li className="task">
                  <span className="task-main">
                    今日の{reservationLabel}はありません
                    <br />
                    <span className="muted">公開予約で作成された予約は一覧に反映されます。</span>
                  </span>
                  <a className="badge" href={withStudioKey("/app/business/reservations", currentProfessionalApp.studioKey)}>一覧へ</a>
                </li>
              ) : null}
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
