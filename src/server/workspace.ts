import type { User, Workspace } from "@/domain/entities";
import { demoWorkspace } from "@/lib/mock-data";

export type WorkspaceContext = {
  workspace: Workspace;
  user: User;
};

export async function resolveWorkspaceContext(_request?: Request): Promise<WorkspaceContext> {
  // Replace this adapter with the production auth provider. Never derive plan,
  // role, workspace, or user identity from client-controlled request headers.
  return {
    workspace: demoWorkspace,
    user: {
      id: demoWorkspace.ownerUserId,
      workspaceId: demoWorkspace.id,
      name: "Demo Owner",
      email: "owner@example.com",
      role: "owner",
      status: "active",
      createdAt: demoWorkspace.createdAt,
      updatedAt: demoWorkspace.updatedAt
    }
  };
}
