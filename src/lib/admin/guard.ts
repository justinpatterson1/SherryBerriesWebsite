import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPERADMIN";
};

/**
 * Resolve the signed-in user IF they are an admin. The session JWT only carries
 * `id`, so the role is read from the DB (mirrors how the account page fetches).
 * Returns null for guests and non-admin customers — callers decide how to react
 * (the page redirects, the API routes 401/403).
 */
export async function requireAdmin(): Promise<AdminUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") return null;

  return {
    id: user.id,
    name: user.name ?? user.email,
    email: user.email,
    role: user.role,
  };
}
