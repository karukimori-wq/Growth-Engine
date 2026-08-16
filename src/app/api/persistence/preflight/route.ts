import { NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";
import { getPersistencePreflight } from "@/server/persistence-preflight";

export async function GET() {
  const preflight = getPersistencePreflight();

  return NextResponse.json(
    {
      appName,
      ...preflight,
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}
