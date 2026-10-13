import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public share pages and their scoped API authorize with share tokens on the server.
  if (
    pathname.startsWith("/share/") ||
    pathname.startsWith("/board-share/") ||
    pathname.startsWith("/api/public/board-share/")
  ) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  const session = getSessionCookie(req);

  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!session && pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/share/:path*",
    "/board-share/:path*",
    "/api/public/board-share/:path*",
  ],
};
