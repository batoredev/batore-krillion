import "server-only";
// Server-side helpers for talking to Hot Comet's Durable Objects from Next.js routes (Cloudflare only).
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PartySettings } from "./engine";

interface Stub { fetch(input: string, init?: RequestInit): Promise<Response> }
interface Namespace { idFromName(name: string): unknown; get(id: unknown): Stub }

function ns() {
  const env = getCloudflareContext().env as unknown as { PARTY_ROOM: Namespace; PARTY_LOBBY: Namespace };
  return env;
}
const lobby = () => { const e = ns(); return e.PARTY_LOBBY.get(e.PARTY_LOBBY.idFromName("lobby")); };
const room = (code: string) => { const e = ns(); return e.PARTY_ROOM.get(e.PARTY_ROOM.idFromName(code)); };

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const newCode = () => Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => CODE_ALPHABET[n % CODE_ALPHABET.length]).join("");

export async function doCreateRoom(host: { userId: string; name: string }, settings: Partial<PartySettings>): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = newCode();
    const res = await room(code).fetch("https://room/init", { method: "POST", body: JSON.stringify({ code, host, settings }) });
    if (res.ok) return code;
    if (res.status !== 409) throw new Error(`Could not create room (${res.status})`);
  }
  throw new Error("Could not find a free room code");
}

export async function doListRooms() {
  return ((await (await lobby().fetch("https://lobby/list")).json()) as { rooms: unknown[] }).rooms;
}

export async function doQuickPlay(who: { userId: string; name: string }) {
  const { code } = (await (await lobby().fetch("https://lobby/quick")).json()) as { code: string | null };
  return code ?? doCreateRoom(who, { isPublic: true });
}
