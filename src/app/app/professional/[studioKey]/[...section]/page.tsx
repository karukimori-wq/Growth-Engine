import { notFound } from "next/navigation";
import { getProfessionalApp } from "@/lib/professional-app-registry";

type Props = {
  params: Promise<{ studioKey: string; section: string[] }>;
};

const sectionTitles: Record<string, string> = {
  customers: "顧客",
  sessions: "新しい鑑定",
  history: "鑑定履歴",
  visits: "来店履歴",
  notes: "メモ"
};

export default async function ProfessionalAppComingSoonPage({ params }: Props) {
  const { studioKey, section } = await params;
  const app = getProfessionalApp(studioKey);

  if (app.studioKey !== studioKey) {
    notFound();
  }

  const sectionKey = section[0] ?? "home";
  const title = sectionTitles[sectionKey] ?? section.join(" /");

  return (
    <main className="main">
      <section className="card">
        <p className="eyebrow">{app.studioName}</p>
        <h1 className="page-title">{title}</h1>
        <dl className="definition-list compact">
          <dt>status</dt>
          <dd>coming_soon</dd>
          <dt>message</dt>
          <dd>MVPでは準備中です</dd>
        </dl>
        <div className="action-row">
          <a className="button" href={`/app/professional/${app.studioKey}`}>{app.studioName}へ戻る</a>
          <a className="button secondary" href="/app/business">Businessホームへ戻る</a>
        </div>
      </section>
    </main>
  );
}
