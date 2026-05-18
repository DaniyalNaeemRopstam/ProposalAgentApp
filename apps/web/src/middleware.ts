import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PA_COOKIE = "pa_token";

async function cookieTokenIsValid(token: string | undefined): Promise<boolean> {
  if (!token?.trim()) return false;
  const secret = process.env.JWT_SECRET;
  if (!secret?.trim()) {
    console.warn("middleware: JWT_SECRET missing; denying protected routes.");
    return false;
  }
  try {
    const key = new TextEncoder().encode(secret);
    await jwtVerify(token.trim(), key);
    return true;
  } catch {
    return false;
  }
}

/** Routes that require a signed-in user (billing & sensitive account actions). */
function requiresAuth(pathname: string, searchParams: URLSearchParams): boolean {
  if (pathname.startsWith("/dashboard/billing")) return true;
  if (pathname === "/dashboard/settings") {
    const tab = searchParams.get("tab");
    if (tab === "billing") return true;
    if (tab === "account" || tab === "delete") return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(PA_COOKIE)?.value;
  const authed = await cookieTokenIsValid(token);

  const isLogin = pathname === "/login" || pathname.startsWith("/login/");
  const isRegister = pathname === "/register" || pathname.startsWith("/register/");
  const isAuthPage = isLogin || isRegister;

  if (requiresAuth(pathname, request.nextUrl.searchParams) && !authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/jobs";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
  ],
};
