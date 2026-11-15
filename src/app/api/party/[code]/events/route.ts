import { getCurrentUser } from "@/lib/auth";
import { subscribe } from "@/party/hub";
import { partyEnabled } from "@/party/enabled";
import { partyTransport } from "@/party/transport";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Server-Sent Events stream of the room's public state.
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  if (!partyEnabled()) return new Response("Party mode is off on this server", { status: 503 });
  if (partyTransport() !== "memory") return new Response("Use the room WebSocket", { status: 400 });
  const user = await getCurrentUser();
  if (!user) return new Response("Not logged in", { status: 401 });
  const { code } = await ctx.params;
  const enc = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try { controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)); } catch { /* closed */ }
      };
      const unsub = subscribe(code, { userId: user.id, name: user.displayName }, (view) => send("state", view));
      if (!unsub) { send("gone", { code }); controller.close(); return; }
      const ping = setInterval(() => send("ping", Date.now()), 15_000);
      cleanup = () => { clearInterval(ping); unsub(); };
      req.signal.addEventListener("abort", () => { cleanup(); try { controller.close(); } catch { /* already closed */ } });
    },
    cancel() { cleanup(); },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" },
  });
}
