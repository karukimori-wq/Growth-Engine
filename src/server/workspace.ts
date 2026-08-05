import type { User, Workspace } from "@/domain/entities";
import { demoWorkspace } from "@/lib/mock-data";

export type WorkspaceContext = {
  workspace: Workspace;
  user: User;
};

export async function resolveWorkspaceContext(): Promise<WorkspaceContext> {
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
