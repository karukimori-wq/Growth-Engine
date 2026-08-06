import { NextResponse } from "next/server";
import { AuthorizationError, requireActiveUser, requireBusinessAccess, requireWorkspaceAccess } from "./authz";
import { resolveWorkspaceContext } from "./workspace";

export async function resolveBusinessApiContext(request?: Request, workspaceId?: string) {
  const context = await resolveWorkspaceContext(request);
  requireActiveUser(context);
  requireBusinessAccess(context);

  if (workspaceId) {
    requireWorkspaceAccess(context, workspaceId);
  }

  return context;
}

export function apiError(error: unknown) {
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
}
