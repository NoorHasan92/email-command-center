"use server";

import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import { revalidatePath } from "next/cache";

/**
 * Ensures the caller is an authenticated ADMIN.
 * Throws an error if not.
 */
async function requireAdmin() {
  const session = await auth();
  // @ts-expect-error - role is extended but not in next-auth DefaultUser type yet
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session.user;
}

/**
 * Fetches all users from the database for the admin dashboard.
 */
export async function getUsers() {
  await requireAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          emailAccounts: true,
          auditLogs: true,
        },
      },
    },
  });

  return users;
}

/**
 * Permanently deletes a user from the system.
 */
export async function deleteUser(userId: string) {
  await requireAdmin();

  // Protect against self-deletion or deleting the primary admin, if desired
  // For now, let's just delete the user using Prisma's cascade deletes
  await db.user.delete({
    where: { id: userId },
  });

  revalidatePath("/admin");
  return { success: true };
}
