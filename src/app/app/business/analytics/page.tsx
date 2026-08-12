import { BusinessComingSoon } from "../_components/business-coming-soon";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AnalyticsPage({ searchParams }: Props) {
  return <BusinessComingSoon menuKey="analytics" searchParams={await searchParams} />;
}
