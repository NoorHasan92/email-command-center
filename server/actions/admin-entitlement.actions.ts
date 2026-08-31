"use server";

import { EntitlementService, EntitlementType, EntitlementValue } from "../services/entitlement.service";
import { requireAdmin } from "./admin.actions";
import { revalidatePath } from "next/cache";

export async function adminGrantEntitlement(
  userId: string, 
  type: EntitlementType, 
  value: EntitlementValue, 
  daysValid?: number
) {
  const admin = await requireAdmin();
  
  let expiresAt: Date | undefined;
  if (daysValid) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);
  }

  await EntitlementService.grant(userId, {
    type,
    value,
    source: "ADMIN_GRANT",
    grantedByAdminId: admin.id!,
    expiresAt
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function adminRevokeEntitlement(
  entitlementId: string,
  userId: string,
  reason: string
) {
  const admin = await requireAdmin();

  await EntitlementService.revoke(entitlementId, admin.id!, reason);

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}
