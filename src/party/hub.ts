import "server-only";
// In-process realtime hub for party rooms. Holds rooms in memory, fires fuse timers,
// and pushes state to subscribers (Server-Sent Events). This is the piece that gets
// swapped when moving to Supabase Realtime or Cloudflare Durable Objects; the rules
// in engine.ts stay as they are.
import { randomInt } from "crypto";
import * as E from "./engine";

type Listener = (view: E.PublicRoom) => void;
interface Entry { room: E.Room; listeners: Set<{ userId: string; fn: Listener }>; timer: NodeJS.Timeout | null; emptySince: number | null }

const LOBBY_GRACE_MS = 20_000;   // disconnected players drop out of a lobby after this
const EMPTY_ROOM_MS = 120_000;   // rooms with nobody connected are deleted after this
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O

const rng: E.Rng = () => randomInt(0, 2 ** 32) / 2 ** 32;
const g = globalThis as unknown as { __kribatovParty?: { rooms: Map<string, Entry>; sweeper: NodeJS.Timeout } };

function state() {
  if (!g.__kribatovParty) {
    const rooms = new Map<string, Entry>();
    const sweeper = setInterval(() => sweep(rooms), 5_000);
    sweeper.unref?.();
    g.__kribatovParty = { rooms, sweeper };
  }
  return g.__kribatovParty;
}

function broadcast(e: Entry) {
  const view = E.publicView(e.room, Date.now());
  for (const l of e.listeners) { try { l.fn(view); } catch { /* listener gone */ } }
}

function schedule(e: Entry) {
  if (e.timer) clearTimeout(e.timer);
  e.timer = null;
  const at = E.nextDeadline(e.room);
  if (at === null) return;
  e.timer = setTimeout(() => {
    e.timer = null;
    if (E.tick(e.room, Date.now(), rng)) broadcast(e);
    schedule(e);
  }, Math.max(0, at - Date.now()) + 5);
}

function sweep(rooms: Map<string, Entry>) {
  const now = Date.now();
  for (const [code, e] of rooms) {
    const r = e.room;
    let changed = false;
    if (r.status === "lobby") {
      for (const p of [...r.players]) {
        if (!p.connected && now - p.lastSeen > LOBBY_GRACE_MS) { E.leave(r, p.userId, now, rng); changed = true; }
      }
    }
    const anyone = r.players.some((p) => p.connected) || r.spectators.some((s) => s.connected);
    if (anyone) e.emptySince = null;
    else if (e.emptySince === null) e.emptySince = now;
    else if (now - e.emptySince > EMPTY_ROOM_MS) { if (e.timer) clearTimeout(e.timer); rooms.delete(code); continue; }
    if (changed) { broadcast(e); schedule(e); }
  }
}

function newCode(rooms: Map<string, Entry>) {
  for (;;) {
    const code = Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]).join("");
    if (!rooms.has(code)) return code;
  }
}

export interface Who { userId: string; name: string }

export function createRoom(host: Who, settings: Partial<E.PartySettings>) {
  const { rooms } = state();
  const room = E.createRoom(newCode(rooms), host, Date.now(), settings);
  room.players[0].connected = false; // becomes connected when their browser subscribes
  rooms.set(room.code, { room, listeners: new Set(), timer: null, emptySince: null });
  return room.code;
}

export const getEntry = (code: string) => state().rooms.get(code.toUpperCase()) ?? null;

export function listPublicRooms() {
  return [...state().rooms.values()]
    .filter((e) => e.room.settings.isPublic && (e.room.players.some((p) => p.connected) || Date.now() - e.room.createdAt < 30_000))
    .map(({ room }) => ({
      code: room.code,
      host: room.players.find((p) => p.userId === room.hostId)?.name ?? "—",
      players: room.players.length,
      maxPlayers: room.settings.maxPlayers,
      status: room.status,
      topic: room.settings.topic,
      lives: room.settings.lives,
    }))
    .sort((a, b) => Number(a.status !== "lobby") - Number(b.status !== "lobby") || b.players - a.players)
    .slice(0, 50);
}

/** Join the first public lobby with space, or create a new public room. */
export function quickPlay(who: Who) {
  const open = [...state().rooms.values()].find((e) =>
    e.room.settings.isPublic && e.room.status === "lobby" && e.room.players.length < e.room.settings.maxPlayers && e.room.players.some((p) => p.connected));
  return open ? open.room.code : createRoom(who, { isPublic: true });
}

/** Run an action against a room, then broadcast and reschedule timers. */
export function act<T>(code: string, fn: (room: E.Room, now: number, rng: E.Rng) => T): T | null {
  const e = getEntry(code);
  if (!e) return null;
  const before = e.room.version;
  const out = fn(e.room, Date.now(), rng);
  if (e.room.version !== before) { broadcast(e); schedule(e); }
  return out;
}

/** Subscribe a viewer. Joins them (player or spectator) and returns an unsubscribe function. */
export function subscribe(code: string, who: Who, fn: Listener): (() => void) | null {
  const e = getEntry(code);
  if (!e) return null;
  const l = { userId: who.userId, fn };
  e.listeners.add(l);
  E.join(e.room, who, Date.now());
  broadcast(e);
  schedule(e);
  return () => {
    e.listeners.delete(l);
    if ([...e.listeners].some((x) => x.userId === who.userId)) return; // still open in another tab
    const now = Date.now();
    const p = e.room.players.find((x) => x.userId === who.userId);
    if (p) { p.connected = false; p.lastSeen = now; }
    const s = e.room.spectators.find((x) => x.userId === who.userId);
    if (s) { s.connected = false; s.lastSeen = now; }
    e.room.version++;
    broadcast(e);
  };
}
