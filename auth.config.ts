import type { NextAuthConfig } from "next-auth";

// Edge-safe Auth.js config. This half is imported by middleware, so it must
// not pull in Node-only code (bcrypt, Prisma). The Credentials provider with
// the actual password check lives in auth.ts.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    // A single admin on a single device: 7 days is a sane working session.
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    // Kept as a declarative statement of the access policy. Enforcement
    // lives in middleware.ts (the wrapper form of `auth()` used there runs
    // its own explicit checks) and again inside every admin page, action
    // and API handler — this callback is the third copy of the same rule,
    // used by Auth.js internals wherever it applies.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/admin/login";
      if (isLoginPage) return true;
      return isLoggedIn;
    },
  },
  providers: [], // filled in auth.ts
};
