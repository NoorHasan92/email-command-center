import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { PersonalProfileService } from "@/services/intelligence/profile.service";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await PersonalProfileService.getOrCreateProfile(session.user.id);
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    logger.error(`[API_PROFILE_GET] Error: ${error.message}`);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === "add_item") {
      const item = await PersonalProfileService.addUserItem(session.user.id, body.item);
      return NextResponse.json({ success: true, item });
    }

    if (body.action === "update_header") {
      const updated = await PersonalProfileService.updateProfileHeader(session.user.id, body.data);
      return NextResponse.json({ success: true, profile: updated });
    }

    if (body.action === "approve_item") {
      const item = await PersonalProfileService.approveItem(session.user.id, body.itemId);
      return NextResponse.json({ success: true, item });
    }

    if (body.action === "reject_item") {
      const item = await PersonalProfileService.rejectItem(session.user.id, body.itemId);
      return NextResponse.json({ success: true, item });
    }

    if (body.action === "delete_item") {
      await PersonalProfileService.deleteItem(session.user.id, body.itemId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    logger.error(`[API_PROFILE_POST] Error: ${error.message}`);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
