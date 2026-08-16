import { BusinessSidebar } from "../../_components/business-sidebar";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MessageDraftBriefPage({ searchParams }: Props) {
  const query = await searchParams;
  const reservationId = first(query.reservationId) ?? "reservation_ref";
  const customerId = first(query.customerId) ?? "customer_ref";
  const followupId = first(query.followupId) ?? "followup_ref";

  return (
    <div className="shell">
      <BusinessSidebar activeKey="repeat" />
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Growth Engine / MessageDraft</p>
            <h2 className="page-title">連絡文案の依頼</h2>
          </div>
          <a className="button secondary" href="/app/business/repeat">
            リピートへ戻る
          </a>
        </header>

        <section className="grid">
          <div className="card span-6">
            <h3>依頼内容</h3>
            <dl className="definition-list compact">
              <dt>purpose</dt><dd>followup_message</dd>
              <dt>customerId</dt><dd>{customerId}</dd>
              <dt>reservationId</dt><dd>{reservationId}</dd>
              <dt>followupId</dt><dd>{followupId}</dd>
            </dl>
            <p className="muted">
              SNS Plannerには参照IDと連絡目的だけを渡します。顧客マスター全文、支払い状態、売上金額、専門記録本文は渡しません。
            </p>
          </div>

          <div className="card span-6">
            <h3>SNS Plannerへテスト依頼</h3>
            <p className="muted">
              MVPでは接続確認用APIを使います。会話文脈を使う返信生成や送信はCommunication Planner側の責務です。
            </p>
            <form action="/api/integrations/sns-planner/message-draft-test" method="post" className="action-row">
              <button className="button" type="submit">
                MessageDraftを作成
              </button>
              <a className="button secondary" href="/app/business/referrals">
                紹介へ戻る
              </a>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
