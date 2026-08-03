import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { whatsappManager } from "@/services/whatsapp/manager";
import { db } from "@/server/repositories/db";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    await whatsappManager.disconnect(userId, true);
    await db.user.update({ where: { id: userId }, data: { whatsappOptIn: false } });

    return NextResponse.json({ success: true });
}
