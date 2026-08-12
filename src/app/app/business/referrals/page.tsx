import { BusinessComingSoon } from "../_components/business-coming-soon";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReferralsPage({ searchParams }: Props) {
  return <BusinessComingSoon menuKey="referrals" searchParams={await searchParams} />;
}
