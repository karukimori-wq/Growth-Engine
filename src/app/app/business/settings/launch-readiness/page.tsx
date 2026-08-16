import { BusinessSidebar } from "@/app/app/business/_components/business-sidebar";
import { getMvpFinalReadiness } from "@/server/mvp-final-readiness";

export const dynamic = "force-dynamic";

function badgeClass(status: string) {
  return status === "success" ? "badge" : "badge warning";
}

export default function LaunchReadinessPage() {
  const readiness = getMvpFinalReadiness();

  return (
    <div className="shell">
      <BusinessSidebar activeKey="launch-readiness" />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / MVP最終確認</p>
            <h2 className="page-title">Launch Readiness</h2>
          </div>
          <span className={badgeClass(readiness.status)}>{readiness.status}</span>
        </header>

        <section className="grid">
          <div className="card span-3">
            <p className="muted">success</p>
            <p className="metric">{readiness.summary.success}</p>
          </div>
          <div className="card span-3">
            <p className="muted">warning</p>
            <p className="metric">{readiness.summary.warning}</p>
          </div>
          <div className="card span-3">
            <p className="muted">error</p>
            <p className="metric">{readiness.summary.error}</p>
          </div>
          <div className="card span-3">
            <p className="muted">skipped</p>
            <p className="metric">{readiness.summary.skipped}</p>
          </div>

          <div className="card span-12">
            <h3>6ステップ状況</h3>
            <div className="table-list">
              {readiness.steps.map((step) => (
                <div className="row-link" key={step.id}>
                  <span>
                    <strong>{step.title}</strong>
                    <br />
                    <span className="muted">{step.evidence}</span>
                    {step.issue ? (
                      <>
                        <br />
                        <span className="muted">issue: {step.issue}</span>
                      </>
                    ) : null}
                    {step.nextAction ? (
                      <>
                        <br />
                        <span className="muted">next: {step.nextAction}</span>
                      </>
                    ) : null}
                  </span>
                  <span className={badgeClass(step.status)}>{step.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card span-6">
            <h3>確認用リンク</h3>
            <div className="action-row">
              <a className="button secondary" href="/api/launch/growth-engine/mvp-final-readiness">Final readiness API</a>
              <a className="button secondary" href="/api/launch/growth-engine/readiness">Launch readiness API</a>
              <a className="button secondary" href="/contracts/status">Contracts status</a>
              <a className="button secondary" href="/app/business/settings/persistence">永続化確認</a>
            </div>
          </div>

          <div className="card span-6">
            <h3>Data Safety</h3>
            <ul className="task-list">
              {Object.entries(readiness.dataSafety).map(([key, value]) => (
                <li className="task" key={key}>
                  <span>{key}</span>
                  <span className="badge">{String(value)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card span-12">
            <p className="muted">checkedAt: {readiness.checkedAt}</p>
            <p className="muted">
              最終的な外部pilot判定は、Postgres Production env設定後に roundtrip と公開予約反映を確認してから ready にします。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
