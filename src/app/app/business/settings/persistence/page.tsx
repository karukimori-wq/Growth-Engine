import { BusinessSidebar } from "@/app/app/business/_components/business-sidebar";
import { appName } from "@/server/app-metadata";
import { getPersistencePreflight } from "@/server/persistence-preflight";
import { RoundtripCheckButton } from "./roundtrip-check-button";

export const dynamic = "force-dynamic";

function StatusBadge({ ready }: { ready: boolean }) {
  return <span className={`badge ${ready ? "" : "warning"}`}>{ready ? "ready" : "needs_fix"}</span>;
}

export default function PersistenceStatusPage() {
  const preflight = getPersistencePreflight();
  const databaseBackedPersistenceReady = preflight.databaseBackedPersistenceReady;
  const blockedUserFlows = databaseBackedPersistenceReady
    ? []
    : [
        "公開予約後、別端末で予約一覧に必ず表示されること",
        "予約詳細が再ログイン後も開けること",
        "顧客詳細が再ログイン後も開けること"
      ];

  return (
    <div className="shell">
      <BusinessSidebar activeKey="persistence" />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / 永続化</p>
            <h2 className="page-title">DB保存ステータス</h2>
          </div>
          <StatusBadge ready={databaseBackedPersistenceReady} />
        </header>

        <section className="grid">
          <div className="card span-4">
            <p className="muted">repository driver</p>
            <p className="metric">{preflight.repositoryDriver}</p>
          </div>
          <div className="card span-4">
            <p className="muted">database backend</p>
            <p className="metric">{preflight.repositoryDriver === "d1" ? "Cloudflare D1" : preflight.repositoryDriver}</p>
          </div>
          <div className="card span-4">
            <p className="muted">DB backed persistence</p>
            <p className="metric">{databaseBackedPersistenceReady ? "active" : "inactive"}</p>
          </div>

          <div className="card span-12">
            <h3>現在の判定</h3>
            <p className="muted">
              {databaseBackedPersistenceReady
                ? "Customer / Reservation は選択中のDB repositoryで保存されます。owner sessionで roundtrip API を実行し、write / read / list を確認してください。"
                : "Customer / Reservation は本番DB保存になっていません。公開予約は受け付けられますが、別端末・別ブラウザ・再ログイン後の表示は保証できません。"}
            </p>
            <div className="action-row">
              <a className="button secondary" href="/api/persistence/status">APIステータスを見る</a>
              <a className="button secondary" href="/api/persistence/preflight">preflightを見る</a>
              <a className="button secondary" href="/app/business/reservations">予約一覧へ戻る</a>
            </div>
          </div>

          <div className="card span-6">
            <h3>Production env preflight</h3>
            <ul className="task-list">
              <li className="task">
                <span><code>GROWTH_REPOSITORY_DRIVER</code></span>
                <span className={`badge ${preflight.env.growthRepositoryDriverConfigured ? "" : "warning"}`}>
                  {preflight.env.growthRepositoryDriverConfigured ? "configured" : "missing"}
                </span>
              </li>
              <li className="task">
                <span>Cloudflare D1 <code>DB</code> binding</span>
                <span className={`badge ${preflight.repositoryDriver === "d1" && databaseBackedPersistenceReady ? "" : "warning"}`}>
                  {preflight.repositoryDriver === "d1" && databaseBackedPersistenceReady ? "ready" : "check status API"}
                </span>
              </li>
              {preflight.repositoryDriver === "postgres"
                ? preflight.env.candidates.map((candidate) => (
                    <li className="task" key={candidate.name}>
                      <span><code>{candidate.name}</code></span>
                      <span className={`badge ${candidate.configured ? "" : "warning"}`}>
                        {candidate.configured ? "configured" : "候補"}
                      </span>
                    </li>
                  ))
                : null}
            </ul>
            <p className="muted">envの値は画面・API・ログに表示しません。表示するのは設定有無のみです。</p>
          </div>

          <div className="card span-6">
            <h3>roundtrip確認</h3>
            <ul className="task-list">
              <li className="task">
                <span>endpoint</span>
                <span><code>{preflight.verification.roundtripEndpoint}</code></span>
              </li>
              <li className="task">
                <span>owner session</span>
                <span className="badge">required</span>
              </li>
              <li className="task">
                <span>期待status</span>
                <span className="badge">success</span>
              </li>
            </ul>
            <p className="muted">テスト作成するデータは参照ID中心です。支払い情報やStripe情報は外部送信しません。</p>
            <div className="divider" />
            <RoundtripCheckButton />
          </div>

          <div className="card span-12">
            <h3>未解決のユーザーフロー</h3>
            {blockedUserFlows.length === 0 ? (
              <p className="muted">DB保存の主要ブロックはありません。</p>
            ) : (
              <ul className="task-list">
                {blockedUserFlows.map((flow) => (
                  <li className="task" key={flow}>
                    <span>{flow}</span>
                    <span className="badge warning">blocked</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card span-12">
            <h3>次の作業</h3>
            <ul className="task-list">
              {preflight.nextActions.map((action) => (
                <li className="task" key={action}>
                  <span>{action}</span>
                  <span className="badge warning">next</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card span-12">
            <h3>Data Safety</h3>
            <ul className="task-list">
              <li className="task"><span>env値の表示</span><span className="badge">false</span></li>
              <li className="task"><span>paymentStatusの外部送信</span><span className="badge">false</span></li>
              <li className="task"><span>salesAmountの外部送信</span><span className="badge">false</span></li>
              <li className="task"><span>Stripe情報の外部送信</span><span className="badge">false</span></li>
              <li className="task"><span>Customer master全文の外部送信</span><span className="badge">false</span></li>
            </ul>
            <p className="muted">checkedAt: {preflight.checkedAt} / appName: {appName}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
