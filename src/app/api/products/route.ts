import { NextResponse } from "next/server";
import { apiError, resolveBusinessApiContext } from "@/server/api";
import { listProducts } from "@/server/repositories";

export async function GET(request: Request) {
  try {
    const context = await resolveBusinessApiContext(request);
    const records = await listProducts(context.workspace.id);

    return NextResponse.json({ products: records });
  } catch (error) {
    return apiError(error);
  }
}
