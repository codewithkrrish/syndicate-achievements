import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

// Route protection, layer 1 of 2 (layer 2: every admin page, server action
// and API handler verifies the session again server-side).
//
// Note on mechanics: with the `auth((req) => ...)` wrapper form, this
// handler — not the `authorized` callback — is responsible for enforcing
// access, so the checks are written out explicitly here:
// - /api/admin/*: unauthenticated calls get a hard 401 JSON, never a
//   redirect (an API client must not be handed an HTML login page).
// - /admin/* pages (except the login page itself): unauthenticated
//   visitors get a real HTTP redirect to /admin/login, before any page
//   code runs.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (pathname.startsWith("/api/admin")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";
    if (!isLoginPage && !isLoggedIn) {
      const loginUrl = new URL("/admin/login", req.nextUrl);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
