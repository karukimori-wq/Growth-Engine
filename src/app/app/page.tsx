import { professionalApps } from "@/lib/professional-app-registry";

export default function AppRootPage() {
  return (
    <main className="main">
      <section className="card">
        <p className="eyebrow">Growth Engine</p>
        <h1 className="page-title">Professional Appを選択</h1>
        <p className="muted">
          Growth EngineはBusiness共通機能を持ち、専門業務は選択したProfessional App側で扱います。
        </p>
        <div className="table-list">
          {professionalApps.map((app) => (
            <a className="row-link" href={`/app/professional/${app.studioKey}`} key={app.studioKey}>
              <span>
                <strong>{app.studioName}</strong>
                <br />
                <span className="muted">{app.domain}</span>
              </span>
              <span className="badge">開く</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
