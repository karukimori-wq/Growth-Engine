import { createPostDraftBriefUrl, getFollowupForScreen, screenFlowSafety } from "@/lib/screen-flow";

type Props = {
  params: Promise<{ followupId: string }>;
};

export default async function FollowupDetailPage({ params }: Props) {
  const { followupId } = await params;
  const { followup, reservation, customer, product } = getFollowupForScreen(followupId);

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="brand">Numeria Studio</h1>
        <nav>
          <div className="nav-group">
            <p className="nav-title">Business</p>
            <a className="nav-link" href="/app/business">今日やること</a>
            <a className="nav-link" href="/app/business/reservations">予約</a>
            <a className="nav-link active" href={`/app/business/followups/${followup.followupId}`}>フォロー</a>
          </div>
        </nav>
      </aside>
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Business / 鑑定後フォロー</p>
            <h2 className="page-title">フォロー確認</h2>
          </div>
          <a className="button" href={createPostDraftBriefUrl(followup.followupId)}>SNS Plannerへ投稿案を依頼</a>
        </header>

        <section className="grid">
          <div className="card span-8">
            <h3>follow-up context</h3>
            <dl className="definition-list">
              <dt>followupId</dt><dd>{followup.followupId}</dd>
              <dt>reservationId</dt><dd>{reservation.id}</dd>
              <dt>customerId</dt><dd>{customer.id}</dd>
              <dt>鑑定メニュー</dt><dd>{product.name}</dd>
              <dt>recommendedAction</dt><dd>{followup.recommendedAction}</dd>
              <dt>status</dt><dd>{followup.status}</dd>
            </dl>
          </div>

          <div className="card span-4">
            <h3>Report参照</h3>
            <dl className="definition-list compact">
              <dt>reportId</dt><dd>{followup.reportRef.reportId}</dd>
              <dt>sourceOfTruth</dt><dd>{followup.reportRef.sourceOfTruth}</dd>
              <dt>本文コピー</dt><dd>{followup.reportRef.reportBodyCopiedToGrowthEngine ? "あり" : "なし"}</dd>
            </dl>
            <div className="divider" />
            <h3>データ安全性</h3>
            <pre className="code-block">{JSON.stringify(screenFlowSafety, null, 2)}</pre>
          </div>
        </section>
      </main>
    </div>
  );
}
