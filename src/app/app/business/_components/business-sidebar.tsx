import { demoWorkspace } from "@/lib/mock-data";
import { getBusinessMenu, getProfessionalApp, professionalApps, type BusinessMenuKey } from "@/lib/professional-app-registry";

type Props = {
  studioKey?: string;
  activeKey?: BusinessMenuKey | "customers" | "persistence" | "launch-readiness";
};

export function BusinessSidebar({ studioKey, activeKey }: Props) {
  const professionalApp = getProfessionalApp(studioKey ?? demoWorkspace.professionalStudioType);
  const businessMenu = getBusinessMenu(professionalApp.studioKey);

  return (
    <aside className="sidebar">
      <h1 className="brand">Growth Engine</h1>
      <nav>
        <div className="nav-group">
          <p className="nav-title">Professional</p>
          <a className="nav-link" href={`/app/professional/${professionalApp.studioKey}`}>
            {professionalApp.studioName}
          </a>
        </div>
        <div className="nav-group">
          <p className="nav-title">Professional App</p>
          {professionalApps.map((item) => (
            <a
              className={item.studioKey === professionalApp.studioKey ? "nav-link active" : "nav-link"}
              href={`/app/business?studioKey=${item.studioKey}`}
              key={item.studioKey}
            >
              {item.studioName}
            </a>
          ))}
        </div>
        <div className="nav-group">
          <p className="nav-title">Business</p>
          <a className={activeKey === "customers" ? "nav-link active" : "nav-link"} href="/app/business/customers">
            お客様
          </a>
          {businessMenu.map((item) => (
            <a className={item.key === activeKey ? "nav-link active" : "nav-link"} href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <div className="nav-group">
          <p className="nav-title">一般顧客向け</p>
          <a className="nav-link" href="/public">
            トップ
          </a>
          <a className="nav-link" href="/public/booking">
            予約ページ
          </a>
        </div>
        <div className="nav-group">
          <p className="nav-title">運用確認</p>
          <a
            className={activeKey === "persistence" ? "nav-link active" : "nav-link"}
            href="/app/business/settings/persistence"
          >
            永続化
          </a>
          <a
            className={activeKey === "launch-readiness" ? "nav-link active" : "nav-link"}
            href="/app/business/settings/launch-readiness"
          >
            MVP最終確認
          </a>
        </div>
      </nav>
    </aside>
  );
}
