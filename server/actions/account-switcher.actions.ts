"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setActiveAccountAction(accountId: string) {
  const cookieStore = await cookies();
  
  if (accountId === "all") {
    cookieStore.delete("selected_account_id");
  } else {
    cookieStore.set("selected_account_id", accountId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  // Revalidate the entire layout to refresh all server components
  revalidatePath("/", "layout");
}
