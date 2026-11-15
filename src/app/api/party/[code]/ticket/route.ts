import { partyEnabled } from "@/party/enabled";
import { fail, json, withUser } from "@/lib/http";
import { signTicket, ticketSecret } from "@/party/ticket";

export const dynamic = "force-dynamic";

// A 60-second ticket that lets this logged-in player open the room's WebSocket (Cloudflare transport).
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  if (!partyEnabled()) return fail("Party mode is off on this server", 503);
  return withUser(async (user) => {
    const { code } = await ctx.params;
    if (!/^[A-Z]{4}$/.test(code)) return fail("Bad room code", 400);
    const secret = ticketSecret(process.env);
    if (!secret) return fail("Party tickets are not configured on this server", 503);
    const ticket = await signTicket({ u: user.id, n: user.displayName, c: code }, secret);
    return json({ url: `/party-ws/${code}?t=${encodeURIComponent(ticket)}` });
  });
}
