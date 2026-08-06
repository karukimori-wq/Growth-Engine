import { NextResponse } from "next/server";
import { appName, getTimestamp } from "@/server/app-metadata";

export async function GET() {
  return NextResponse.json(
    {
      appName,
      status: "ok",
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}
