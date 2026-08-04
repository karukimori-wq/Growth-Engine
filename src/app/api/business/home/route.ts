import { NextResponse } from "next/server";
import { demoWorkspace, insights, todayReservations } from "@/lib/mock-data";
import { canAccessBusiness } from "@/lib/plan";

export function GET() {
  if (!canAccessBusiness(demoWorkspace.plan)) {
    return NextResponse.json(
      {
        error: "Business plan is required."
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    workspace: demoWorkspace,
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
