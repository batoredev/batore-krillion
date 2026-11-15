// One place that turns a player's action into an engine call.
// Used by the Node hub (local / single server) and by the Cloudflare Durable Object.
import * as E from "./engine";

export type PartyAction =
  | { type: "answer"; text: string }
  | { type: "typing"; text: string }
  | { type: "start" }
  | { type: "settings"; settings: Partial<E.PartySettings> }
  | { type: "lobby" }
  | { type: "leave" };

export type ActionOutcome = E.AnswerOutcome | { ok: boolean; error?: string };

export function applyAction(room: E.Room, userId: string, a: PartyAction, now: number, rng: E.Rng): ActionOutcome {
  switch (a?.type) {
    case "answer": return E.submitAnswer(room, userId, String(a.text ?? ""), now);
    case "typing": return { ok: E.setTyping(room, userId, String(a.text ?? "")) };
    case "start": { const err = E.start(room, userId, now, rng); return err ? { ok: false, error: err } : { ok: true }; }
    case "settings": { const err = E.updateSettings(room, userId, a.settings ?? {}); return err ? { ok: false, error: err } : { ok: true }; }
    case "lobby": { const err = E.resetToLobby(room, userId, now); return err ? { ok: false, error: err } : { ok: true }; }
    case "leave": E.leave(room, userId, now, rng); return { ok: true };
    default: return { ok: false, error: "Unknown action" };
  }
}

/** Client → server message over the WebSocket. `id` asks for a reply. */
export type ClientMessage = PartyAction & { id?: number };
/** Server → client messages. */
export type ServerMessage =
  | { type: "state"; room: E.PublicRoom }
  | { type: "result"; id: number; out: ActionOutcome }
  | { type: "gone" };
