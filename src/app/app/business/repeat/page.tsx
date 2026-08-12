import { BusinessComingSoon } from "../_components/business-coming-soon";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RepeatPage({ searchParams }: Props) {
  return (
    <BusinessComingSoon
      menuKey="repeat"
      searchParams={await searchParams}
      primaryAction={{
        label: "フォローを確認",
        href: "/app/business/followups/followup_res_001_post_session"
      }}
    />
  );
}
