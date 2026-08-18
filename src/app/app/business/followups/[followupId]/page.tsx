import { demoWorkspace, products } from "@/lib/mock-data";
import { mvpFollowupContext, mvpReportRef, screenFlowSafety } from "@/lib/screen-flow";
import { getBusinessReservation } from "@/server/business-reservations";
import { findCustomer } from "@/server/repositories";

type Props = {
  params: Promise<{ followupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildBriefHref(path: string, input: { followupId: string; reservationId: string; customerId: string }) {
  const params = new URLSearchParams({
    followupId: input.followupId,
    reservationId: input.reservationId,
    customerId: input.customerId,
    returnTo: `/app/business/followups/${input.followupId}?reservationId=${input.reservationId}&customerId=${input.customerId}`
  });

  return `${path}?${params.toString()}`;
}

export default async function FollowupDetailPage({ params, searchParams }: Props) {
  const { followupId } = await params;
  const query = await searchParams;
  const requestedReservationId = first(query.reservationId) ?? mvpFollowupContext.reservationId;
  const requestedCustomerId = first(query.customerId) ?? mvpFollowupContext.customerId;
  const record = await getBusinessReservation(requestedReservationId, demoWorkspace.id);
  const reservation = record?.reservation ?? {
    id: requestedReservationId,
    workspaceId: demoWorkspace.id,
    customerId: requestedCustomerId,
    productId: "prd_numeria_basic",
    professionalStudioType: demoWorkspace.professionalStudioType,
    scheduledStartAt: new Date().toISOString(),
    scheduledEndAt: new Date().toISOString(),
    status: "requested" as const,
    sourceChannel: "unknown",
    paymentStatus: "unpaid" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const customer =
    record?.customer ??
    (requestedCustomerId ? await findCustomer(demoWorkspace.id, requestedCustomerId) : undefined);
  const product =
    record?.product ??
    products.find((item) => item.workspaceId === demoWorkspace.id && item.id === reservation.productId) ??
    products[0];
  const customerId = reservation.customerId ?? requestedCustomerId;
  const followup = {
    ...mvpFollowupContext,
    followupId,
    reservationId: reservation.id,
    customerId,
    reportRef: mvpReportRef,
    evidenceRefs: [`reservation:${reservation.id}`, `report:${mvpReportRef.reportId}`]
  };
  const postDraftHref = buildBriefHref("/app/business/post-draft-briefs/new", {
    followupId,
    reservationId: reservation.id,
    customerId
  });
  const messageDraftHref = buildBriefHref("/app/business/message-draft-briefs/new", {
    followupId,
    reservationId: reservation.id,
    customerId
  });

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="brand">Growth Engine</h1>
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
          <a className="button" href={postDraftHref}>SNS Plannerへ投稿案を依頼</a>
        </header>

        <section className="grid">
          <div className="card span-8">
            <h3>follow-up context</h3>
            <dl className="definition-list">
              <dt>followupId</dt><dd>{followup.followupId}</dd>
              <dt>reservationId</dt><dd>{reservation.id}</dd>
              <dt>customerId</dt><dd>{customerId}</dd>
              <dt>お客様</dt><dd>{customer?.displayName ?? "参照IDのみ"}</dd>
              <dt>鑑定メニュー</dt><dd>{product.name}</dd>
              <dt>recommendedAction</dt><dd>{followup.recommendedAction}</dd>
              <dt>status</dt><dd>{followup.status}</dd>
            </dl>
            <div className="action-row">
              <a className="button secondary" href={`/app/business/reservations/${reservation.id}`}>
                予約詳細へ戻る
              </a>
              <a className="button secondary" href={messageDraftHref}>
                連絡文案を依頼
              </a>
            </div>
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
