import { partyEnabled } from "@/party/enabled";
import { partyTransport } from "@/party/transport";
import { body, fail, json, withUser } from "@/lib/http";
import { act } from "@/party/hub";
import { applyAction, type PartyAction } from "@/party/apply";

// Actions for the in-memory (Node) transport. On Cloudflare, actions travel over the room's WebSocket.
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  if (!partyEnabled()) return fail("Party mode is off on this server", 503);
  if (partyTransport() !== "memory") return fail("Use the room WebSocket", 400);
  return withUser(async (user) => {
    const { code } = await ctx.params;
    const a = await body<PartyAction>(req);
    const out = act(code, (room, now, rng) => applyAction(room, user.id, a, now, rng));
    if (out === null) return fail("Room not found", 404);
    return json(out);
  });
}
