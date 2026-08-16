import { NextResponse } from "next/server";
import { getMvpFinalReadiness } from "@/server/mvp-final-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getMvpFinalReadiness(), { status: 200 });
}
