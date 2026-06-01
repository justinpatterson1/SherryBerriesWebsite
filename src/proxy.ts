import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth(() => {
  // The `authorized` callback in auth.config.ts gates access; when it returns
  // false, NextAuth redirects to its default sign-in page automatically.
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/wishlist"],
};
