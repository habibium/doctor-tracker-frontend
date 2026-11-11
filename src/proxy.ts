import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * An optimistic check: it only looks for a session cookie, so signed-out visitors are
 * redirected before any page renders. The session itself is verified by the API on every
 * request and by `getCurrentUser()` on the server.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const login = new URL("/login", request.url);
  if (pathname !== "/dashboard") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/dashboard/:path*", "/doctors/:path*", "/patients/:path*", "/users/:path*"],
};
