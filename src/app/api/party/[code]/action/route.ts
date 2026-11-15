import { partyEnabled } from "@/party/enabled";
import { body, fail, json, withUser } from "@/lib/http";
import { act } from "@/party/hub";
import * as E from "@/party/engine";

type Action =
  | { type: "answer"; text: string }
  | { type: "typing"; text: string }
  | { type: "start" }
  | { type: "settings"; settings: Partial<E.PartySettings> }
  | { type: "lobby" }
  | { type: "leave" };

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  if (!partyEnabled()) return fail("Party mode is off on this server", 503);
  return withUser(async (user) => {
    const { code } = await ctx.params;
    const a = await body<Action>(req);
    const out = act(code, (room, now, rng) => {
      switch (a.type) {
        case "answer": return E.submitAnswer(room, user.id, String(a.text ?? ""), now);
        case "typing": return { ok: E.setTyping(room, user.id, String(a.text ?? "")) };
        case "start": { const err = E.start(room, user.id, now, rng); return err ? { ok: false, error: err } : { ok: true }; }
        case "settings": { const err = E.updateSettings(room, user.id, a.settings ?? {}); return err ? { ok: false, error: err } : { ok: true }; }
        case "lobby": { const err = E.resetToLobby(room, user.id, now); return err ? { ok: false, error: err } : { ok: true }; }
        case "leave": E.leave(room, user.id, now, rng); return { ok: true };
        default: return { ok: false, error: "Unknown action" };
      }
    });
    if (out === null) return fail("Room not found", 404);
    return json(out);
  });
}
