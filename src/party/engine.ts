// Party mode ("Hot Comet") game rules as a pure state machine.
// No timers, sockets or storage in here: the caller passes `now` and a random source,
// so the same rules can run on this Node server today and in Supabase/Cloudflare later.
import { ALL_PROMPTS, promptById } from "@/content";
import { TOPICS, type TopicId } from "@/content/types";
import { answerCount, matchAnswer, normalize } from "@/game/match";
import { TIER_KEYS, type TierKey } from "@/game/tiers";

export const PARTY_LIMITS = { minPlayers: 2, maxPlayers: 10, maxLives: 5, minPromptAnswers: 40 } as const;
export const POP_PAUSE_MS = 3000;

export interface PartySettings {
  maxPlayers: number;      // 2–10
  lives: number;           // 1–5
  fuseMinMs: number;       // hidden fuse is random between min and max
  fuseMaxMs: number;
  minFuseOnPassMs: number; // if less than this is left when passed, it's topped up to this
  topic: TopicId | "all";
  isPublic: boolean;
}
export const DEFAULT_SETTINGS: PartySettings = {
  maxPlayers: 6, lives: 2, fuseMinMs: 10_000, fuseMaxMs: 30_000, minFuseOnPassMs: 8_000, topic: "all", isPublic: true,
};

export interface PartyPlayer {
  userId: string;
  name: string;
  lives: number;
  alive: boolean;
  connected: boolean;
  lastSeen: number;
  answers: number;
  points: number;           // rarity points from valid answers, a tiebreak-free bonus stat
  bestTier: TierKey | null;
  placedAt: number | null;  // finishing position once out (1 = winner)
}

export type LogEntry =
  | { t: number; type: "answer"; userId: string; answer: string; tier: TierKey }
  | { t: number; type: "pop"; userId: string; livesLeft: number }
  | { t: number; type: "out"; userId: string }
  | { t: number; type: "join" | "leave"; userId: string }
  | { t: number; type: "prompt"; text: string }
  | { t: number; type: "win"; userId: string };

export interface Room {
  code: string;
  hostId: string;
  settings: PartySettings;
  status: "lobby" | "playing" | "finished";
  players: PartyPlayer[];        // turn order
  spectators: { userId: string; name: string; connected: boolean; lastSeen: number }[];
  holderId: string | null;
  promptId: string | null;
  used: { key: string; answer: string; tier: TierKey; by: string }[];
  recentPrompts: string[];
  fuseEndsAt: number | null;     // SECRET: never sent to clients
  pausedUntil: number | null;    // short break after a pop
  holderSince: number | null;
  typing: string;
  log: LogEntry[];
  winnerId: string | null;
  createdAt: number;
  version: number;
}

export type Rng = () => number;

export function createRoom(code: string, host: { userId: string; name: string }, now: number, settings: Partial<PartySettings> = {}): Room {
  const room: Room = {
    code, hostId: host.userId, settings: sanitizeSettings({ ...DEFAULT_SETTINGS, ...settings }), status: "lobby",
    players: [], spectators: [], holderId: null, promptId: null, used: [], recentPrompts: [],
    fuseEndsAt: null, pausedUntil: null, holderSince: null, typing: "", log: [], winnerId: null, createdAt: now, version: 0,
  };
  join(room, host, now);
  return room;
}

export function sanitizeSettings(s: PartySettings): PartySettings {
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number(n) || lo)));
  const fuseMin = clamp(s.fuseMinMs, 5_000, 60_000);
  return {
    maxPlayers: clamp(s.maxPlayers, PARTY_LIMITS.minPlayers, PARTY_LIMITS.maxPlayers),
    lives: clamp(s.lives, 1, PARTY_LIMITS.maxLives),
    fuseMinMs: fuseMin,
    fuseMaxMs: clamp(s.fuseMaxMs, fuseMin, 90_000),
    minFuseOnPassMs: clamp(s.minFuseOnPassMs, 3_000, fuseMin),
    topic: s.topic === "all" || TOPICS.some((t) => t.id === s.topic) ? s.topic : "all",
    isPublic: Boolean(s.isPublic),
  };
}

const bump = (room: Room) => { room.version++; };
const addLog = (room: Room, e: LogEntry) => { room.log.push(e); if (room.log.length > 40) room.log.shift(); };
const alivePlayers = (room: Room) => room.players.filter((p) => p.alive);

/** Join as a player (lobby with space) or as a spectator (game running or room full). Idempotent. */
export function join(room: Room, who: { userId: string; name: string }, now: number): "player" | "spectator" {
  const existing = room.players.find((p) => p.userId === who.userId);
  if (existing) { existing.connected = true; existing.lastSeen = now; bump(room); return "player"; }
  const spec = room.spectators.find((s) => s.userId === who.userId);
  if (room.status === "lobby" && room.players.length < room.settings.maxPlayers) {
    if (spec) room.spectators = room.spectators.filter((s) => s.userId !== who.userId);
    room.players.push({ userId: who.userId, name: who.name, lives: room.settings.lives, alive: true, connected: true, lastSeen: now, answers: 0, points: 0, bestTier: null, placedAt: null });
    addLog(room, { t: now, type: "join", userId: who.userId });
    bump(room);
    return "player";
  }
  if (spec) { spec.connected = true; spec.lastSeen = now; }
  else room.spectators.push({ userId: who.userId, name: who.name, connected: true, lastSeen: now });
  bump(room);
  return "spectator";
}

/** Leave the room. Mid-game this counts as being knocked out. */
export function leave(room: Room, userId: string, now: number, rng: Rng) {
  room.spectators = room.spectators.filter((s) => s.userId !== userId);
  const p = room.players.find((x) => x.userId === userId);
  if (!p) { bump(room); return; }
  addLog(room, { t: now, type: "leave", userId });
  if (room.status === "playing" && p.alive) {
    const wasHolder = room.holderId === userId;
    const next = wasHolder ? nextAlive(room, userId) : null;
    knockOut(room, p, now);
    if (!checkWin(room, now) && wasHolder && next) { room.holderId = next.userId; room.holderSince = now; room.typing = ""; }
  }
  if (room.status !== "playing") room.players = room.players.filter((x) => x.userId !== userId);
  if (room.hostId === userId) {
    const heir = room.players.find((x) => x.userId !== userId && x.connected) ?? room.players.find((x) => x.userId !== userId);
    if (heir) room.hostId = heir.userId;
  }
  void rng;
  bump(room);
}

export function updateSettings(room: Room, byUserId: string, patch: Partial<PartySettings>): string | null {
  if (byUserId !== room.hostId) return "Only the host can change settings.";
  if (room.status !== "lobby") return "Settings can only change in the lobby.";
  room.settings = sanitizeSettings({ ...room.settings, ...patch });
  if (room.players.length > room.settings.maxPlayers) room.settings.maxPlayers = room.players.length;
  for (const p of room.players) p.lives = room.settings.lives;
  bump(room);
  return null;
}

export function promptPool(topic: PartySettings["topic"]) {
  return ALL_PROMPTS.filter((p) => (topic === "all" || p.topic === topic) && answerCount(p) >= PARTY_LIMITS.minPromptAnswers);
}

function newPrompt(room: Room, rng: Rng, now: number) {
  const pool = promptPool(room.settings.topic);
  const fresh = pool.filter((p) => !room.recentPrompts.includes(p.id));
  const choice = (fresh.length ? fresh : pool)[Math.floor(rng() * (fresh.length ? fresh.length : pool.length))];
  room.promptId = choice.id;
  room.recentPrompts = [...room.recentPrompts, choice.id].slice(-Math.max(1, Math.floor(pool.length * 0.75)));
  room.used = [];
  addLog(room, { t: now, type: "prompt", text: choice.text });
}

const randomFuse = (room: Room, rng: Rng) => room.settings.fuseMinMs + Math.floor(rng() * (room.settings.fuseMaxMs - room.settings.fuseMinMs + 1));

export function start(room: Room, byUserId: string, now: number, rng: Rng): string | null {
  if (byUserId !== room.hostId) return "Only the host can start.";
  if (room.status === "playing") return "Already playing.";
  const ready = room.players.filter((p) => p.connected);
  if (ready.length < PARTY_LIMITS.minPlayers) return `Need at least ${PARTY_LIMITS.minPlayers} connected players.`;
  room.players = ready.map((p) => ({ ...p, lives: room.settings.lives, alive: true, answers: 0, points: 0, bestTier: null, placedAt: null }));
  room.status = "playing";
  room.winnerId = null;
  room.log = [];
  room.recentPrompts = [];
  newPrompt(room, rng, now);
  room.holderId = room.players[Math.floor(rng() * room.players.length)].userId;
  room.holderSince = now;
  room.fuseEndsAt = now + randomFuse(room, rng);
  room.pausedUntil = null;
  room.typing = "";
  bump(room);
  return null;
}

function nextAlive(room: Room, afterUserId: string): PartyPlayer | null {
  const i = room.players.findIndex((p) => p.userId === afterUserId);
  for (let k = 1; k <= room.players.length; k++) {
    const p = room.players[(i + k) % room.players.length];
    if (p.alive && p.userId !== afterUserId) return p;
  }
  return null;
}

function knockOut(room: Room, p: PartyPlayer, now: number) {
  p.alive = false;
  p.lives = 0;
  p.placedAt = alivePlayers(room).length + 1;
  addLog(room, { t: now, type: "out", userId: p.userId });
}

function checkWin(room: Room, now: number): boolean {
  const alive = alivePlayers(room);
  if (alive.length > 1) return false;
  room.status = "finished";
  room.winnerId = alive[0]?.userId ?? null;
  if (alive[0]) { alive[0].placedAt = 1; addLog(room, { t: now, type: "win", userId: alive[0].userId }); }
  room.holderId = null; room.fuseEndsAt = null; room.pausedUntil = null; room.typing = "";
  return true;
}

export type AnswerOutcome =
  | { ok: true; answer: string; tier: TierKey; points: number }
  | { ok: false; reason: "not-your-turn" | "not-playing" | "paused" | "invalid" | "used"; answer?: string };

/** The comet holder names an answer. Valid + unused passes the comet on. */
export function submitAnswer(room: Room, userId: string, text: string, now: number): AnswerOutcome {
  if (room.status !== "playing") return { ok: false, reason: "not-playing" };
  if (room.pausedUntil && now < room.pausedUntil) return { ok: false, reason: "paused" };
  if (room.holderId !== userId) return { ok: false, reason: "not-your-turn" };
  const prompt = room.promptId ? promptById(room.promptId) : null;
  if (!prompt) return { ok: false, reason: "not-playing" };
  const m = matchAnswer(prompt, text);
  if (!m) return { ok: false, reason: "invalid" };
  const key = normalize(m.answer);
  if (room.used.some((u) => u.key === key)) return { ok: false, reason: "used", answer: m.answer };

  const me = room.players.find((p) => p.userId === userId)!;
  room.used.push({ key, answer: m.answer, tier: m.tier, by: userId });
  me.answers++;
  me.points += m.points;
  if (!me.bestTier || TIER_KEYS.indexOf(m.tier) > TIER_KEYS.indexOf(me.bestTier)) me.bestTier = m.tier;
  addLog(room, { t: now, type: "answer", userId, answer: m.answer, tier: m.tier });

  const next = nextAlive(room, userId);
  if (next) {
    room.holderId = next.userId;
    room.holderSince = now;
    // The fuse keeps burning; the next holder inherits what's left, topped up to the minimum.
    if ((room.fuseEndsAt ?? now) - now < room.settings.minFuseOnPassMs) room.fuseEndsAt = now + room.settings.minFuseOnPassMs;
  }
  room.typing = "";
  bump(room);
  return { ok: true, answer: m.answer, tier: m.tier, points: m.points };
}

export function setTyping(room: Room, userId: string, text: string) {
  if (room.status !== "playing" || room.holderId !== userId) return false;
  room.typing = String(text).slice(0, 60);
  bump(room);
  return true;
}

/** Advance time: pops the comet when the fuse runs out, and resumes after the pause. */
export function tick(room: Room, now: number, rng: Rng): boolean {
  if (room.status !== "playing") return false;
  if (room.pausedUntil) {
    if (now < room.pausedUntil) return false;
    room.pausedUntil = null;
    room.holderSince = now;
    room.fuseEndsAt = now + randomFuse(room, rng);
    bump(room);
    return true;
  }
  if (room.fuseEndsAt === null || now < room.fuseEndsAt) return false;

  const victim = room.players.find((p) => p.userId === room.holderId);
  if (!victim) return false;
  victim.lives--;
  addLog(room, { t: now, type: "pop", userId: victim.userId, livesLeft: Math.max(0, victim.lives) });
  const next = nextAlive(room, victim.userId);
  if (victim.lives <= 0) knockOut(room, victim, now);
  if (checkWin(room, now)) { bump(room); return true; }
  // New prompt, new fuse after a short break; the comet goes to the next player.
  room.holderId = (next ?? victim).userId;
  room.typing = "";
  newPrompt(room, rng, now);
  room.fuseEndsAt = null;
  room.pausedUntil = now + POP_PAUSE_MS;
  bump(room);
  return true;
}

/** When the room next needs a tick (fuse end or end of pause). */
export const nextDeadline = (room: Room): number | null =>
  room.status !== "playing" ? null : room.pausedUntil ?? room.fuseEndsAt;

/** Back to the lobby with the same people (host only). */
export function resetToLobby(room: Room, byUserId: string, now: number): string | null {
  if (byUserId !== room.hostId) return "Only the host can do that.";
  if (room.status !== "finished") return "The game isn't over yet.";
  room.status = "lobby";
  const promote = room.spectators.filter((s) => s.connected).slice(0, Math.max(0, room.settings.maxPlayers - room.players.length));
  room.spectators = room.spectators.filter((s) => !promote.includes(s));
  room.players = [
    ...room.players.filter((p) => p.connected),
    ...promote.map((s) => ({ userId: s.userId, name: s.name, lives: 0, alive: true, connected: true, lastSeen: now, answers: 0, points: 0, bestTier: null, placedAt: null })),
  ].map((p) => ({ ...p, lives: room.settings.lives, alive: true, placedAt: null }));
  room.holderId = null; room.promptId = null; room.used = []; room.typing = ""; room.winnerId = null;
  bump(room);
  return null;
}

/** What clients may see. The fuse end time is deliberately left out. */
export function publicView(room: Room, now: number) {
  const prompt = room.promptId ? promptById(room.promptId) : null;
  return {
    code: room.code, hostId: room.hostId, settings: room.settings, status: room.status,
    players: room.players.map(({ userId, name, lives, alive, connected, answers, points, bestTier, placedAt }) => ({ userId, name, lives, alive, connected, answers, points, bestTier, placedAt })),
    spectators: room.spectators.map(({ userId, name, connected }) => ({ userId, name, connected })),
    holderId: room.holderId,
    prompt: prompt ? { id: prompt.id, text: prompt.text, topic: prompt.topic } : null,
    used: room.used.map(({ answer, tier, by }) => ({ answer, tier, by })),
    paused: room.pausedUntil !== null && now < room.pausedUntil,
    holderForMs: room.holderSince ? Math.max(0, now - room.holderSince) : 0,
    typing: room.typing,
    log: room.log.slice(-15),
    winnerId: room.winnerId,
    version: room.version,
  };
}
export type PublicRoom = ReturnType<typeof publicView>;
