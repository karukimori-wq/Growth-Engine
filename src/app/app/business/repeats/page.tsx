import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RepeatsAliasPage({ searchParams }: Props) {
  const query = await searchParams;
  const studioKey = first(query.studioKey);
  const params = new URLSearchParams();

  if (studioKey) {
    params.set("studioKey", studioKey);
  }

  redirect(`/app/business/repeat${params.size > 0 ? `?${params.toString()}` : ""}`);
}
