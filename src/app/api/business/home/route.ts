import { NextResponse } from "next/server";
import { insights, todayReservations } from "@/lib/mock-data";
import { requireBusinessAccess } from "@/server/authz";
import { resolveWorkspaceContext } from "@/server/workspace";

export async function GET(request: Request) {
  const context = await resolveWorkspaceContext(request);

  try {
    requireBusinessAccess(context);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  return NextResponse.json({
    workspace: context.workspace,
    metrics: {
      monthlyRevenue: 186000,
      newCustomers: 12,
      repeatReservations: 7,
      openLeads: 3,
      followupTargets: 4
    },
    todayReservations,
    insights
  });
}
