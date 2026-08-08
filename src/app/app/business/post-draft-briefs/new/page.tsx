import { mvpPostDraftBrief, snsPlannerBaseUrl } from "@/lib/screen-flow";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewPostDraftBriefPage({ searchParams }: Props) {
  const query = await searchParams;
  const followupId = first(query.followupId) ?? "followup_res_001_post_session";
  const reservationId = first(query.reservationId) ?? "res_001";
  const customerId = first(query.customerId) ?? "cus_001";
  const briefPayload = {
    ...mvpPostDraftBrief,
    inputRef: {
      followupId,
      reservationId,
      customerId
    }
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="brand">Numeria Studio</h1>
        <nav>
          <div className="nav-group">
            <p className="nav-title">Business</p>
            <a className="nav-link" href="/app/business">今日やること</a>
            <a className="nav-link" href="/app/business/reservations">予約</a>
            <a className="nav-link active" href="/app/business/post-draft-briefs/new">集客</a>
          </div>
        </nav>
      </aside>
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Business / 投稿ブリーフ</p>
            <h2 className="page-title">SNS Plannerへ投稿案を依頼</h2>
          </div>
          <a className="button secondary" href={`/app/business/followups/${followupId}`}>フォローへ戻る</a>
        </header>

        <section className="grid">
          <div className="card span-8">
            <h3>Growth Engineが決める内容</h3>
            <dl className="definition-list">
              <dt>objective</dt><dd>{mvpPostDraftBrief.objective}</dd>
              <dt>targetAudience</dt><dd>{mvpPostDraftBrief.targetAudience}</dd>
              <dt>topic</dt><dd>{mvpPostDraftBrief.topic}</dd>
              <dt>contentType</dt><dd>{mvpPostDraftBrief.contentType}</dd>
              <dt>channel</dt><dd>{mvpPostDraftBrief.channel}</dd>
              <dt>cta</dt><dd>{mvpPostDraftBrief.cta}</dd>
              <dt>destinationUrl</dt><dd>{mvpPostDraftBrief.destinationUrl}</dd>
            </dl>
            <form action="/api/integrations/sns-planner/post-draft-test" method="post" className="action-row">
              <button className="button" type="submit">PostDraft作成へ進む</button>
              <a className="button secondary" href={snsPlannerBaseUrl}>SNS Plannerを開く</a>
            </form>
          </div>

          <div className="card span-4">
            <h3>SNS Plannerへ渡すpayload</h3>
            <pre className="code-block">{JSON.stringify(briefPayload, null, 2)}</pre>
            <p className="muted">投稿作成に必要な目的・対象・テーマ・CTA・destinationUrlのみを渡します。</p>
          </div>
        </section>
      </main>
    </div>
  );
}
