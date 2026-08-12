import { BusinessComingSoon } from "../_components/business-coming-soon";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SalesPage({ searchParams }: Props) {
  return <BusinessComingSoon menuKey="sales" searchParams={await searchParams} />;
}
