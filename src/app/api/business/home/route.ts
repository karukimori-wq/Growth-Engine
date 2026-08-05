import { NextResponse } from "next/server";
import { insights, todayReservations } from "@/lib/mock-data";
import { apiError, resolveBusinessApiContext } from "@/server/api";

export async function GET(request: Request) {
  try {
    const context = await resolveBusinessApiContext(request);

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
  } catch (error) {
    return apiError(error);
  }
}
