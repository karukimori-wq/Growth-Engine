import { NextRequest, NextResponse } from "next/server";
import { authSessionCookieName, verifySessionToken } from "@/server/auth-session";

const operationalTestApiPaths = new Set([
  "/api/integrations/ai-platform-core/activity-test",
  "/api/integrations/communication-planner/handoff-test",
  "/api/integrations/numeria-studio/session-start-test",
  "/api/integrations/sns-planner/message-draft-test",
  "/api/integrations/sns-planner/post-draft-test",
  "/api/integrations/velvet/handoff-test",
  "/api/integrations/velvet/visit-start-test"
]);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isBusinessRoute = pathname.startsWith("/app/business");
  const isOperationalTestApi = operationalTestApiPaths.has(pathname);

  if (!isBusinessRoute && !isOperationalTestApi) {
    return NextResponse.next();
  }

  const hasOwnerSession = await verifySessionToken(
    request.cookies.get(authSessionCookieName)?.value
  );

  if (hasOwnerSession) {
    return NextResponse.next();
  }

  if (isOperationalTestApi) {
    return NextResponse.json(
      { error: "Authenticated owner session is required." },
      { status: 401 }
    );
  }

  const signInUrl = request.nextUrl.clone();
  signInUrl.pathname = "/app/sign-in";
  signInUrl.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/app/business/:path*", "/api/integrations/:path*"]
};
