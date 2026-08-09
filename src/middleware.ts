import { NextRequest, NextResponse } from "next/server";

const demoBusinessCookie = "ge_demo_business_user";

export function middleware(request: NextRequest) {
  const isBusinessRoute = request.nextUrl.pathname.startsWith("/app/business");

  if (!isBusinessRoute) {
    return NextResponse.next();
  }

  const hasDemoBusinessAccess =
    request.cookies.get(demoBusinessCookie)?.value === "owner";

  if (hasDemoBusinessAccess) {
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
