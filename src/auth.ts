import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { authConfig } from "@/auth.config";
import { authLimiters, checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Thrown when login is rate-limited. The `code` surfaces to the client via
// signIn's response (result.code), letting the form show a distinct message
// instead of the generic "wrong email or password".
class RateLimitSignin extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 20 * 60,
    updateAge: 5 * 60,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        // Brute-force / credential-stuffing guard, keyed by IP + email. This is
        // the real credential-verification chokepoint, so it can't be bypassed.
        const ip = getClientIp(request);
        const rl = await checkRateLimit(
          authLimiters.login,
          `${ip}:${email.toLowerCase()}`,
        );
        if (!rl.success) throw new RateLimitSignin();

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // Block sign-in until the email is verified.
        if (!user.emailVerified) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
