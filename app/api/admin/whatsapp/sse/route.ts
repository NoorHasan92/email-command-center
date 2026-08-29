import { NextRequest } from "next/server";
import { auth } from "@/config/auth";
import { whatsappManager } from "@/services/whatsapp/manager";
import { DatabaseStore } from "@/services/whatsapp/session-store/DatabaseStore";
import { db } from "@/server/repositories/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: string, data: any) => {
                try {
                    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
                } catch (e) {}
            };

            const store = new DatabaseStore(SYSTEM_SENDER_ID);
            const meta = await store.getMetadata();
            
            if (meta?.phoneNumber) {
                send('status', { status: 'connected', ...meta });
            } else {
                send('status', { status: 'connecting' });
                // We connect lazily here
                whatsappManager.connect(SYSTEM_SENDER_ID).catch(console.error);
            }

            const qrListener = (qr: string) => send('qr', { qr });
            const statusListener = async (data: any) => {
                if (data.status === 'connected') {
                    const latestMeta = await store.getMetadata();
                    send('status', { status: 'connected', ...latestMeta });
                } else {
                    send('status', data);
                }
            };

            whatsappManager.on(`qr-${SYSTEM_SENDER_ID}`, qrListener);
            whatsappManager.on(`status-${SYSTEM_SENDER_ID}`, statusListener);

            req.signal.addEventListener('abort', () => {
                whatsappManager.off(`qr-${SYSTEM_SENDER_ID}`, qrListener);
                whatsappManager.off(`status-${SYSTEM_SENDER_ID}`, statusListener);
            });
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    });
}
