import { BusinessComingSoon } from "../_components/business-coming-soon";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MarketingPage({ searchParams }: Props) {
  return (
    <BusinessComingSoon
      menuKey="marketing"
      searchParams={await searchParams}
      primaryAction={{
        label: "投稿案を依頼する",
        href: "/app/business/post-draft-briefs/new"
      }}
    />
  );
}
