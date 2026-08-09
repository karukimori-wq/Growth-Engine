type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/app/business")
    ? params.next
    : "/app/business";

  return (
    <main className="public-page">
      <section className="public-panel">
        <p className="eyebrow">占い師向け</p>
        <h1 className="page-title">Businessにログイン</h1>
        <p className="muted">
          MVP確認用のデモ認証です。一般顧客向け予約ページとは導線を分離しています。
        </p>
        <form action="/api/auth/demo-sign-in" method="post" className="form-stack">
          <input type="hidden" name="next" value={nextPath} />
          <button className="button" type="submit">デモOwnerとして入る</button>
        </form>
      </section>
    </main>
  );
}
