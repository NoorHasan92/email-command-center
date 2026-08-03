import { NextRequest } from "next/server";
import { auth } from "@/config/auth";
import { whatsappManager } from "@/services/whatsapp/manager";
import { DatabaseStore } from "@/services/whatsapp/session-store/DatabaseStore";
import QRCode from 'qrcode';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: string, data: any) => {
                try {
                    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
                } catch (e) {}
            };

            const store = new DatabaseStore(userId);
            const meta = await store.getMetadata();
            
            if (meta?.phoneNumber) {
                send('status', { status: 'connected', ...meta });
            } else {
                send('status', { status: 'connecting' });
                // We connect lazily here
                whatsappManager.connect(userId).catch(console.error);
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

            whatsappManager.on(`qr-${userId}`, qrListener);
            whatsappManager.on(`status-${userId}`, statusListener);

            req.signal.addEventListener('abort', () => {
                whatsappManager.off(`qr-${userId}`, qrListener);
                whatsappManager.off(`status-${userId}`, statusListener);
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
