import type { BusinessMenuKey } from "@/lib/professional-app-registry";
import { getBusinessMenuLabel, getProfessionalApp } from "@/lib/professional-app-registry";

type Props = {
  menuKey: BusinessMenuKey;
  searchParams?: Record<string, string | string[] | undefined>;
  primaryAction?: {
    label: string;
    href: string;
  };
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function withStudioKey(href: string, studioKey: string) {
  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);

  params.set("studioKey", studioKey);

  return `${pathname}?${params.toString()}`;
}

export function BusinessComingSoon({ menuKey, searchParams, primaryAction }: Props) {
  const app = getProfessionalApp(first(searchParams?.studioKey));
  const title = getBusinessMenuLabel(menuKey, app.studioKey);

  return (
    <main className="main">
      <section className="card">
        <p className="eyebrow">Business / {app.studioName}</p>
        <h1 className="page-title">{title}</h1>
        <dl className="definition-list compact">
          <dt>status</dt>
          <dd>coming_soon</dd>
          <dt>message</dt>
          <dd>MVPでは準備中です</dd>
        </dl>
        <div className="action-row">
          {primaryAction ? <a className="button" href={withStudioKey(primaryAction.href, app.studioKey)}>{primaryAction.label}</a> : null}
          <a className={primaryAction ? "button secondary" : "button"} href={withStudioKey("/app/business", app.studioKey)}>ホームへ戻る</a>
        </div>
      </section>
    </main>
  );
}
