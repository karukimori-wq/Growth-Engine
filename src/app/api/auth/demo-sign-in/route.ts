import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const nextValue = formData.get("next");
  const nextPath =
    typeof nextValue === "string" && nextValue.startsWith("/app/business")
      ? nextValue
      : "/app/business";
  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);

  response.cookies.set("ge_demo_business_user", "owner", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/app/business",
    maxAge: 60 * 60
  });

  return response;
}
