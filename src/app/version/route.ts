import { NextResponse } from "next/server";
import { appName, appVersion, contractVersion, getCommitSha, getTimestamp } from "@/server/app-metadata";

export async function GET() {
  return NextResponse.json(
    {
      appName,
      appVersion,
      contractVersion,
      commitSha: getCommitSha(),
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}
