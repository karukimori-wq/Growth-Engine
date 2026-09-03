import { notFound } from "next/navigation";
import { businessPlanContract, isBusinessPublicEntryVisible } from "@/domain/plan-contract";
import { getBusinessMenu, getProfessionalApp, professionalApps } from "@/lib/professional-app-registry";

type Props = {
  params: Promise<{ studioKey: string }>;
};

export default async function ProfessionalAppHomePage({ params }: Props) {
  const { studioKey } = await params;
  const app = getProfessionalApp(studioKey);
  const businessMenu = getBusinessMenu(app.studioKey);
  const showBusinessEntry = isBusinessPublicEntryVisible(
    businessPlanContract.businessOfferingStatus,
  );

  if (app.studioKey !== studioKey) {
    notFound();
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1 className="brand">{app.studioName}</h1>
        <nav>
          <div className="nav-group">
            <p className="nav-title">Professional</p>
            {app.professionalMenu.map((item) => (
              <a className="nav-link" href={item.href} key={item.href}>{item.label}</a>
            ))}
          </div>
          {showBusinessEntry ? (
            <div className="nav-group">
              <p className="nav-title">Business</p>
              {businessMenu.map((item) => (
                <a className={item.key === "today" ? "nav-link active" : "nav-link"} href={item.href} key={item.href}>{item.label}</a>
              ))}
            </div>
          ) : null}
          <div className="nav-group">
            <p className="nav-title">Professional App</p>
            {professionalApps.map((item) => (
              <a className={item.studioKey === app.studioKey ? "nav-link active" : "nav-link"} href={`/app/professional/${item.studioKey}`} key={item.studioKey}>{item.studioName}</a>
            ))}
          </div>
          {showBusinessEntry ? (
            <div className="nav-group">
              <p className="nav-title">管理者向け</p>
              <a className="nav-link" href="/app/business/reservations">予約確認</a>
            </div>
          ) : null}
        </nav>
      </aside>
      <main className="main">
        <header className="page-header">
          <div>
            <p className="eyebrow">Professional App Home</p>
            <h2 className="page-title">{app.studioName}</h2>
          </div>
          {showBusinessEntry ? (
            <a className="button secondary" href={`/app/business?studioKey=${app.studioKey}`}>Businessホーム</a>
          ) : null}
        </header>

        <section className="grid">
          <div className={showBusinessEntry ? "card span-6" : "card span-12"}>
            <h3>Professional</h3>
            <div className="table-list">
              {app.professionalMenu.map((item) => (
                <a className="row-link" href={item.href} key={item.href}>
                  <span>{item.label}</span>
                  <span className="badge">開く</span>
                </a>
              ))}
            </div>
          </div>
          {showBusinessEntry ? (
            <div className="card span-6">
              <h3>Business</h3>
              <div className="table-list">
                {businessMenu.map((item) => (
                  <a className="row-link" href={item.href} key={item.href}>
                    <span>{item.label}</span>
                    <span className="badge">開く</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
