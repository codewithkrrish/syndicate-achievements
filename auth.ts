import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

// Single-admin authentication.
// - There is exactly one account: the guild owner. No registration exists
//   anywhere in the app, and no user table is kept — the credentials live in
//   environment variables (ADMIN_USERNAME + ADMIN_PASSWORD_HASH), so the
//   database never holds password material.
// - The password is only ever compared as a bcrypt hash. The plaintext is
//   known solely to the owner and is never written to code, seed, or docs.
// - Sessions are JWTs in an httpOnly cookie (Auth.js default), signed with
//   AUTH_SECRET.

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username =
          typeof credentials?.username === "string" ? credentials.username : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        const expectedUser = process.env.ADMIN_USERNAME;
        // Bcrypt hashes are full of "$" — and .env loaders with variable
        // expansion (Next.js applies dotenv-expand locally) read "$12$abc"
        // as variable references and mangle the value. The documented local
        // form therefore escapes every dollar (\$), which expansion turns
        // back into a literal $. This unescape is the safety net for the
        // opposite path (escaped value pasted somewhere with no expansion,
        // e.g. directly into Vercel): a raw bcrypt hash never contains a
        // backslash, so stripping "\$" can only repair, never corrupt.
        const expectedHash = process.env.ADMIN_PASSWORD_HASH?.replace(
          /\\\$/g,
          "$",
        );
        if (!expectedUser || !expectedHash || !username || !password) {
          return null;
        }

        // Username comparison is exact; password comparison is bcrypt.
        // Both must pass. Any failure returns null, and the login page shows
        // one generic error — never which field was wrong.
        if (username !== expectedUser) return null;
        const ok = await bcrypt.compare(password, expectedHash);
        if (!ok) return null;

        return { id: "admin", name: username };
      },
    }),
  ],
});
