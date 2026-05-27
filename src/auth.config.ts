import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      // Real implementation lives in auth.ts — bcrypt + Prisma aren't edge-safe,
      // so the edge-safe config keeps a no-op placeholder.
      authorize: async () => null,
    }),
  ],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
