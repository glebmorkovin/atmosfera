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

  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProd && pathname.startsWith("/demo")) {
    const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Страница недоступна</title>
    <style>
      body { margin: 0; font-family: "Manrope", "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0b0b0c; color: #f2f2f2; }
      .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
      .card { max-width: 520px; width: 100%; border-radius: 16px; border: 1px solid rgba(255,255,255,0.12); background: #0f0f11; padding: 32px; text-align: center; }
      .pill { display: inline-block; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12); padding: 4px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #a0a0a7; }
      h1 { font-size: 22px; margin: 12px 0 8px; }
      p { color: rgba(255,255,255,0.7); margin: 0 0 16px; }
      a { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 10px 20px; text-decoration: none; background: #1677ff; color: #fff; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <span class="pill">404</span>
        <h1>Раздел демо недоступен</h1>
        <p>В production этот раздел закрыт. Перейдите на основную версию продукта.</p>
        <a href="/">На главную</a>
      </div>
    </div>
  </body>
</html>`;
    return new Response(html, {
      status: 404,
      headers: { "Cache-Control": "no-store", "Content-Type": "text/html; charset=utf-8" }
    });
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
  matcher: ["/demo/:path*", "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
