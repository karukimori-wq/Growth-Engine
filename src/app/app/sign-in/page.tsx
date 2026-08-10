type Props = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/app/business")
    ? params.next
    : "/app/business";
  const hasError = params.error === "invalid_access_code";

  return (
    <main className="public-page">
      <section className="public-panel">
        <p className="eyebrow">占い師向け</p>
        <h1 className="page-title">Businessにログイン</h1>
        <p className="muted">
          占い師本人だけがBusiness機能に入れるよう、サーバー署名済みsessionを発行します。
        </p>
        <form action="/api/auth/sign-in" method="post" className="form-stack">
          <input type="hidden" name="next" value={nextPath} />
          <label className="field-label">
            Owner access code
            <input name="accessCode" type="password" required />
          </label>
          {hasError ? (
            <p className="muted">access codeが一致しません。</p>
          ) : null}
          <button className="button" type="submit">Businessに入る</button>
        </form>
      </section>
    </main>
  );
}
