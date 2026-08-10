import { NextRequest, NextResponse } from "next/server";
import { authSessionCookieName, verifySessionToken } from "@/server/auth-session";

export async function middleware(request: NextRequest) {
  const isBusinessRoute = request.nextUrl.pathname.startsWith("/app/business");

  if (!isBusinessRoute) {
    return NextResponse.next();
  }

  const hasOwnerSession = await verifySessionToken(
    request.cookies.get(authSessionCookieName)?.value
  );

  if (hasOwnerSession) {
    return NextResponse.next();
  }

  const signInUrl = request.nextUrl.clone();
  signInUrl.pathname = "/app/sign-in";
  signInUrl.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/app/business/:path*"]
};
