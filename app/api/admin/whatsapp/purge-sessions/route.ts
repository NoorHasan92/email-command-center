import { NextRequest } from "next/server";
import { auth } from "@/config/auth";
import { db } from "@/server/repositories/db";

/**
 * POST /api/admin/whatsapp/purge-sessions
 * Purges all orphaned WhatsApp session rows from the database for SYSTEM_SENDER.
 * This is a cleanup endpoint for the pre-key storm issue.
 */
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

    try {
        const result = await db.whatsAppSession.deleteMany({
            where: {
                userId: "SYSTEM_SENDER"
            }
        });

        return Response.json({
            success: true,
            deletedCount: result.count,
            message: `Purged ${result.count} SYSTEM_SENDER session rows. You will need to re-scan the QR code.`
        });
    } catch (error: any) {
        return Response.json(
            { error: `Failed to purge sessions: ${error.message}` },
            { status: 500 }
        );
    }
}
