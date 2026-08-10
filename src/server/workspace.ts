import type { User, Workspace } from "@/domain/entities";
import { demoWorkspace } from "@/lib/mock-data";
import { authSessionCookieName, getCookieValue, verifySessionToken } from "./auth-session";

export type WorkspaceContext = {
  workspace: Workspace;
  user: User;
};

export type WorkspaceContextProvider = {
  resolve(request?: Request): Promise<WorkspaceContext>;
};

function createProductionWorkspaceContextProvider(): WorkspaceContextProvider {
  return {
    async resolve(request) {
      const session = await verifySessionToken(
        getCookieValue(request, authSessionCookieName)
      );

      if (!session) {
        throw new Error("Authenticated owner session is required.");
      }

      return {
        workspace: demoWorkspace,
        user: {
          id: session.userId,
          workspaceId: session.workspaceId,
          name: "Workspace Owner",
          email: "owner@example.com",
          role: session.role,
          status: session.status,
          createdAt: demoWorkspace.createdAt,
          updatedAt: demoWorkspace.updatedAt
        }
      };
    }
  };
}

const workspaceContextProvider = createProductionWorkspaceContextProvider();

export function getWorkspaceContextProvider(): WorkspaceContextProvider {
  return workspaceContextProvider;
}

export async function resolveWorkspaceContext(_request?: Request): Promise<WorkspaceContext> {
  return workspaceContextProvider.resolve(_request);
}
