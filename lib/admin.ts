import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLES = ["support", "admin", "super_admin"];

/**
 * Returns the acting admin's user id if they're authenticated and hold an
 * admin-capable role, otherwise null. Every admin write route should call
 * this first and bail with 401/403 if it returns null.
 */
export async function requireAdmin(): Promise<{ adminId: string; role: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as any).role as string | undefined;
  const id = (session.user as any).id as string | undefined;
  if (!id || !role || !ADMIN_ROLES.includes(role)) return null;
  return { adminId: id, role };
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  meta: Record<string, unknown> = {}
) {
  await prisma.auditLog.create({
    data: { adminId, action, targetType, targetId, metaJson: meta },
  });
}
