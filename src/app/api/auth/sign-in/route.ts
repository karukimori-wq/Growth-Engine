import { NextResponse } from "next/server";
import {
  authSessionCookieName,
  createOwnerSessionToken,
  isValidOwnerAccessCode
} from "@/server/auth-session";

export async function POST(request: Request) {
  const formData = await request.formData();
  const nextValue = formData.get("next");
  const accessCodeValue = formData.get("accessCode");
  const nextPath =
    typeof nextValue === "string" && nextValue.startsWith("/app/business")
      ? nextValue
      : "/app/business";

  if (
    typeof accessCodeValue !== "string" ||
    !isValidOwnerAccessCode(accessCodeValue)
  ) {
    const signInUrl = new URL("/app/sign-in", request.url);
    signInUrl.searchParams.set("next", nextPath);
    signInUrl.searchParams.set("error", "invalid_access_code");

    return NextResponse.redirect(signInUrl, 303);
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
  const sessionToken = await createOwnerSessionToken();

  response.cookies.set(authSessionCookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8
  });

  return response;
}
