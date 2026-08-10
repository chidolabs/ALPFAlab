import { NextRequest, NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE, AUTH_COOKIE, hashPasscode } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  const expected = await hashPasscode(process.env.APP_PASSCODE ?? "");

  if (!cookie || !expected || cookie !== expected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    const adminCookie = request.cookies.get(ADMIN_AUTH_COOKIE)?.value;
    const adminExpected = await hashPasscode(process.env.ADMIN_PASSCODE ?? "");
    if (!adminCookie || !adminExpected || adminCookie !== adminExpected) {
      const adminLoginUrl = new URL("/admin/login", request.url);
      adminLoginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
