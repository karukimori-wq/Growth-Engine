import { NextResponse } from "next/server";
import { getContractStatus } from "@/server/app-metadata";

export async function GET() {
  return NextResponse.json(getContractStatus(), { status: 200 });
}
