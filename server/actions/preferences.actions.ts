"use server";

import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";
import { revalidatePath } from "next/cache";

export async function updateAppPreferencesAction(preferences: Record<string, any>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    // Merge existing preferences
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { appPreferences: true }
    });

    const currentPrefs = typeof user?.appPreferences === 'object' && user.appPreferences !== null 
      ? user.appPreferences as Record<string, any>
      : {};

    const updatedPrefs = {
      ...currentPrefs,
      ...preferences
    };

    await db.user.update({
      where: { id: session.user.id },
      data: { appPreferences: updatedPrefs }
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    console.error("[updateAppPreferencesAction]", error);
    return { error: error.message || "Failed to update preferences" };
  }
}
