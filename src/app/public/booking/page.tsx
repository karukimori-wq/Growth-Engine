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
        <p><strong>鑑定メニュー</strong>: 数秘術ベーシック鑑定</p>
        <p><strong>予約導線</strong>: フォーム入力、Stripe Checkout連携予定</p>
        <p className="muted">MVP画面確認では、占い師向け管理画面と一般顧客向け画面の導線分離を確認するための公開ページです。</p>
      </section>
    </main>
  );
}
