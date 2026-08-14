import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAuditLog } from "@/server/audit-log";
import { publishEvent } from "@/server/events";
import { createCustomer, findCustomer, listCustomers } from "@/server/repositories";

export const runtime = "nodejs";

const createSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  displayName: z.string().trim().min(1).max(120)
}).strict();

function authorized(request: Request) {
  const expected = process.env.VELVET_INTEGRATION_SECRET?.trim();
  if (!expected) return { ok: false as const, response: NextResponse.json({ status: "error", error: { code: "INTEGRATION_NOT_CONFIGURED" } }, { status: 503 }) };
  if (request.headers.get("x-source-app") !== "velvet") return { ok: false as const, response: NextResponse.json({ status: "error", error: { code: "INVALID_SOURCE_APP" } }, { status: 401 }) };
  const received = request.headers.get("x-velvet-integration-secret")?.trim() ?? "";
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  const match = left.length === right.length && timingSafeEqual(left, right);
  if (!match) return { ok: false as const, response: NextResponse.json({ status: "error", error: { code: "UNAUTHORIZED" } }, { status: 401 }) };
  return { ok: true as const };
}

function display(customer: { id: string; displayName: string }) {
  return { customerId: customer.id, displayName: customer.displayName };
}

export async function GET(request: Request) {
  const auth = authorized(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId")?.trim();
  const customerId = url.searchParams.get("customerId")?.trim();
  if (!workspaceId) return NextResponse.json({ status: "error", error: { code: "WORKSPACE_ID_REQUIRED" } }, { status: 400 });

  if (customerId) {
    const customer = await findCustomer(workspaceId, customerId);
    if (!customer) return NextResponse.json({ status: "error", error: { code: "CUSTOMER_NOT_FOUND" } }, { status: 404 });
    return NextResponse.json({ status: "success", customer: display(customer) });
  }

  const customers = await listCustomers(workspaceId);
  return NextResponse.json({ status: "success", customers: customers.map(display) });
}

export async function POST(request: Request) {
  const auth = authorized(request);
  if (!auth.ok) return auth.response;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ status: "error", error: { code: "INVALID_CUSTOMER_CREATE", details: parsed.error.flatten() } }, { status: 400 });

  const customer = await createCustomer({
    workspaceId: parsed.data.workspaceId,
    displayName: parsed.data.displayName,
    contactInformation: {},
    snsAccounts: {},
    customerStatus: "active",
    totalRevenue: 0,
    purchaseCount: 0
  });

  await publishEvent({
    eventType: "growth.customer.created.v1",
    source: "growth-engine",
    workspaceId: customer.workspaceId,
    payload: { customerId: customer.id }
  });
  await recordAuditLog({
    workspaceId: customer.workspaceId,
    actorUserId: parsed.data.userId,
    action: "Customer.Created",
    targetType: "customer",
    targetId: customer.id,
    metadata: { operation: "Customer.Create", sourceApp: "velvet" }
  });

  return NextResponse.json({
    status: "success",
    operation: "Customer.Create",
    eventName: "growth.customer.created.v1",
    customer: display(customer)
  }, { status: 201 });
}
