import { NextResponse } from "next/server";
import { getMvpFinalReadiness } from "@/server/mvp-final-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await getMvpFinalReadiness();

  return NextResponse.json(readiness, { status: 200 });
}
