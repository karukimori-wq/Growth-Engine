import type { WorkspaceContext } from "./workspace";
import { canAccessBusiness } from "@/lib/plan";

export class AuthorizationError extends Error {
  status = 403;

  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function requireBusinessAccess(context: WorkspaceContext) {
  if (!canAccessBusiness(context.workspace.plan)) {
    throw new AuthorizationError("Business plan is required.");
  }
}

export function requireWorkspaceAccess(context: WorkspaceContext, workspaceId: string) {
  if (context.workspace.id !== workspaceId || context.user.workspaceId !== workspaceId) {
    throw new AuthorizationError("Workspace access is denied.");
  }
}
