import { NextResponse } from "next/server";
import { getPersistenceStatus } from "@/server/persistence-status";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getPersistenceStatus(), { status: 200 });
}
