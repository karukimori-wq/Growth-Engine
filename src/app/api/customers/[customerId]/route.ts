import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, resolveBusinessApiContext } from "@/server/api";
import { recordAuditLog } from "@/server/audit-log";
import { findCustomer, updateCustomer } from "@/server/repositories";

const updateCustomerSchema = z.object({
  displayName: z.string().min(1).optional(),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  lineUserId: z.string().optional(),
  sourceChannel: z.string().optional(),
  customerStatus: z.enum(["active", "inactive", "blocked"]).optional()
});

type Props = {
  params: Promise<{ customerId: string }>;
};

export async function GET(request: Request, { params }: Props) {
  try {
    const { customerId } = await params;
    const context = await resolveBusinessApiContext(request);
    const customer = await findCustomer(context.workspace.id, customerId);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: Props) {
  const body = await request.json();
  const parsed = updateCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid customer update.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { customerId } = await params;
    const context = await resolveBusinessApiContext(request);
    const currentCustomer = await findCustomer(context.workspace.id, customerId);

    if (!currentCustomer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const contactInformation = {
      ...currentCustomer.contactInformation,
      ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {})
    };
    const customer = await updateCustomer(context.workspace.id, customerId, {
      displayName: parsed.data.displayName,
      name: parsed.data.name,
      lineUserId: parsed.data.lineUserId,
      sourceChannel: parsed.data.sourceChannel,
      customerStatus: parsed.data.customerStatus,
      contactInformation
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    await recordAuditLog({
      workspaceId: customer.workspaceId,
      actorUserId: context.user.id,
      action: "Customer.Updated",
      targetType: "customer",
      targetId: customer.id,
      metadata: {
        operation: "update",
        sourceChannel: customer.sourceChannel,
        customerStatus: customer.customerStatus
      }
    });

    return NextResponse.json({ customer });
  } catch (error) {
    return apiError(error);
  }
}
