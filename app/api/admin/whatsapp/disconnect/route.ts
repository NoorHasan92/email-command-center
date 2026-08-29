import { NextRequest } from "next/server";
import { auth } from "@/config/auth";
import { whatsappManager } from "@/services/whatsapp/manager";
import { db } from "@/server/repositories/db";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    // Verify admin
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== "ADMIN") {
        return new Response("Forbidden", { status: 403 });
    }

    const SYSTEM_SENDER_ID = "SYSTEM_SENDER";

    try {
        await whatsappManager.disconnect(SYSTEM_SENDER_ID, true);
        return new Response("OK", { status: 200 });
    } catch (error) {
        return new Response("Failed to disconnect", { status: 500 });
    }
}
