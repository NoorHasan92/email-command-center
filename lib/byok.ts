import { EntitlementService } from "@/server/services/entitlement.service";

export async function hasByokAccess(userId: string): Promise<boolean> {
  return await EntitlementService.hasFeatureAccess(userId, "BYOK_ADDON");
}
