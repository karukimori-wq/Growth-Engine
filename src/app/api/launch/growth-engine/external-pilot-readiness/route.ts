import { NextResponse } from "next/server";
import { getExternalPilotReadiness } from "@/server/external-pilot-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = await getExternalPilotReadiness();

  return NextResponse.json(readiness, { status: 200 });
}
