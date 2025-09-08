import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas públicas
  const PUBLIC = ["/", "/login", "/register", "/reset-password", "/api", "/public", "/_next", "/favicon.ico"];
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublic) return NextResponse.next();

  // Protegemos /dashboard, /test-ui y /perfil
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/test-ui") ||
    pathname.startsWith("/perfil");

  if (!isProtected) return NextResponse.next();

  // Supabase coloca cookies: sb-access-token / sb-refresh-token
  const hasSession =
    req.cookies.get("sb-access-token")?.value || req.cookies.get("sb:token")?.value;

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/test-ui/:path*", "/perfil/:path*"],
};
