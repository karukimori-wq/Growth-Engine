export default function PublicBookingPage() {
  return (
    <main className="public-page">
      <section className="public-panel">
        <p className="eyebrow">一般顧客向け</p>
        <h1 className="page-title">数秘術鑑定の予約</h1>
        <p className="muted">
          このページは鑑定依頼者向けの予約導線です。管理画面、売上、顧客一覧、AI提案には移動できません。
        </p>
        <div className="divider" />
        <form action="/api/public/bookings" method="post" className="form-stack">
          <label className="field-label">
            表示名
            <input name="customerDisplayName" placeholder="例: 予約者A" />
          </label>
          <label className="field-label">
            鑑定メニュー
            <select name="productId" defaultValue="prd_numeria_basic">
              <option value="prd_numeria_basic">数秘術ベーシック鑑定</option>
              <option value="prd_numeria_followup">リピート鑑定</option>
            </select>
          </label>
          <label className="field-label">
            希望日
            <input name="preferredDate" type="date" required />
          </label>
          <label className="field-label">
            希望時間
            <input name="preferredTime" type="time" required />
          </label>
          <button className="button" type="submit">予約を送信</button>
        </form>
        <p className="muted">
          予約作成時の workspaceId / ownerUserId はGrowth Engine側で紐付けます。一般顧客は管理画面へ移動できません。
        </p>
      </section>
    </main>
  );
}
