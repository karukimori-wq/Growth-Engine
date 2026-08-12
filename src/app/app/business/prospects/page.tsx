import { BusinessComingSoon } from "../_components/business-coming-soon";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProspectsPage({ searchParams }: Props) {
  return <BusinessComingSoon menuKey="prospects" searchParams={await searchParams} />;
}
