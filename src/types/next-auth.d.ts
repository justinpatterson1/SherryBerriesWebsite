import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /**
       * Carried for UI decisions only — showing the navbar's Dashboard link.
       * Never treat this as an authorization check: it comes from the JWT and
       * can lag a role change. Server-side guards use requireAdmin(), which
       * reads the role from the database.
       */
      role?: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}
