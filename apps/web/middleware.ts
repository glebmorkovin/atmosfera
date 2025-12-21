import { NextRequest, NextResponse } from "next/server";

const roleHome = (role?: string) => {
  const upper = role?.toUpperCase();
  if (upper === "ADMIN") return "/admin/dashboard";
  if (upper === "SCOUT") return "/app/scout/dashboard";
  if (upper === "CLUB") return "/app/club/dashboard";
  if (upper === "PARENT") return "/app/parent/dashboard";
  return "/app/player/dashboard";
};

const roleMatchesPrefix = (role: string | undefined, prefix: string) => {
  const upper = role?.toUpperCase();
  if (prefix.startsWith("/admin")) return upper === "ADMIN";
  if (prefix.startsWith("/demo")) return upper === "ADMIN";
  if (prefix.startsWith("/app/player")) return upper === "PLAYER";
  if (prefix.startsWith("/app/parent")) return upper === "PARENT";
  if (prefix.startsWith("/app/scout")) return upper === "SCOUT";
  if (prefix.startsWith("/app/club")) return upper === "CLUB";
  if (prefix.startsWith("/notifications")) return !!upper && upper !== "ADMIN";
  return true;
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const protectedPrefixes = ["/app", "/admin", "/demo", "/notifications"];
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const roleCookie = request.cookies.get("userRole")?.value;
  if (!roleCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (roleCookie.toUpperCase() === "ADMIN" && !pathname.startsWith("/admin") && !pathname.startsWith("/demo")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (!roleMatchesPrefix(roleCookie, pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = roleHome(roleCookie);
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
