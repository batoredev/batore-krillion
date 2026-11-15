// Hot Comet on Cloudflare: one Durable Object per room (PartyRoom) and one directory of public rooms (PartyLobby).
// The game rules are the same pure engine used everywhere else (src/party/engine.ts).
import { DurableObject } from "cloudflare:workers";
import * as E from "../src/party/engine";
import { applyAction, type ClientMessage, type ServerMessage } from "../src/party/apply";

export interface PartyEnv {
  PARTY_ROOM: DurableObjectNamespace<PartyRoom>;
  PARTY_LOBBY: DurableObjectNamespace<PartyLobby>;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  KRIBATOV_PARTY_SECRET?: string;
}

const LOBBY_GRACE_MS = 20_000;  // disconnected players drop out of a lobby after this
const EMPTY_ROOM_MS = 120_000;  // a room nobody is connected to is closed after this
const SWEEP_MS = 5_000;

const rng: E.Rng = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
interface Who { userId: string; name: string }

export interface RoomSummary {
  code: string; host: string; players: number; maxPlayers: number; status: string;
  topic: string; lives: number; isPublic: boolean; anyoneConnected: boolean; createdAt: number; updatedAt: number;
}

export class PartyRoom extends DurableObject<PartyEnv> {
  private room: E.Room | null = null;
  private emptySince: number | null = null;
  private lastSummary = "";

  constructor(ctx: DurableObjectState, env: PartyEnv) {
    super(ctx, env);
    // Rooms survive hibernation and restarts: state is kept in Durable Object storage.
    ctx.blockConcurrencyWhile(async () => {
      this.room = (await ctx.storage.get<E.Room>("room")) ?? null;
      this.emptySince = (await ctx.storage.get<number>("emptySince")) ?? null;
    });
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/init" && req.method === "POST") {
      if (this.room) return new Response("exists", { status: 409 });
      const { code, host, settings } = (await req.json()) as { code: string; host: Who; settings: Partial<E.PartySettings> };
      this.room = E.createRoom(code, host, Date.now(), settings);
      this.room.players[0].connected = false; // connected once their browser opens the socket
      this.room.players[0].lastSeen = Date.now();
      await this.commit(true);
      return new Response("ok");
    }
    if (url.pathname === "/ws") {
      if (req.headers.get("Upgrade") !== "websocket") return new Response("Expected WebSocket", { status: 426 });
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      if (!this.room) {
        server.send(JSON.stringify({ type: "gone" } satisfies ServerMessage));
        server.close(1000, "gone");
        return new Response(null, { status: 101, webSocket: client });
      }
      const who: Who = { userId: url.searchParams.get("u") ?? "", name: url.searchParams.get("n") ?? "Player" };
      server.serializeAttachment(who);
      E.join(this.room, who, Date.now());
      await this.commit(true);
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response("Not found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (!this.room) return;
    const who = ws.deserializeAttachment() as Who | null;
    if (!who) return;
    let msg: ClientMessage;
    try { msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw)); } catch { return; }
    const before = this.room.version;
    const out = applyAction(this.room, who.userId, msg, Date.now(), rng);
    if (typeof msg.id === "number") ws.send(JSON.stringify({ type: "result", id: msg.id, out } satisfies ServerMessage));
    if (this.room.version !== before) await this.commit(msg.type !== "typing");
  }

  async webSocketClose(ws: WebSocket) { await this.disconnected(ws); }
  async webSocketError(ws: WebSocket) { await this.disconnected(ws); }

  private async disconnected(ws: WebSocket) {
    if (!this.room) return;
    const who = ws.deserializeAttachment() as Who | null;
    if (!who) return;
    const stillOpen = this.ctx.getWebSockets().some((s) => s !== ws && (s.deserializeAttachment() as Who | null)?.userId === who.userId);
    if (stillOpen) return; // same player in another tab
    const now = Date.now();
    const p = this.room.players.find((x) => x.userId === who.userId);
    if (p) { p.connected = false; p.lastSeen = now; }
    const s = this.room.spectators.find((x) => x.userId === who.userId);
    if (s) { s.connected = false; s.lastSeen = now; }
    this.room.version++;
    await this.commit(true);
  }

  async alarm() {
    if (!this.room) return;
    const now = Date.now();
    const r = this.room;
    const before = r.version;
    E.tick(r, now, rng);
    if (r.status === "lobby") {
      for (const p of [...r.players]) if (!p.connected && now - p.lastSeen > LOBBY_GRACE_MS) E.leave(r, p.userId, now, rng);
    }
    const anyone = r.players.some((p) => p.connected) || r.spectators.some((s) => s.connected);
    if (anyone) this.emptySince = null;
    else if (this.emptySince === null) this.emptySince = now;
    else if (now - this.emptySince > EMPTY_ROOM_MS) {
      await this.lobby().fetch("https://lobby/remove", { method: "POST", body: JSON.stringify({ code: r.code }) });
      this.room = null;
      await this.ctx.storage.deleteAll();
      return;
    }
    await this.commit(r.version !== before);
  }

  /** Broadcast (if changed), persist, report to the lobby and schedule the next alarm. */
  private async commit(broadcast: boolean) {
    const r = this.room;
    if (!r) return;
    const now = Date.now();
    if (broadcast) {
      const msg = JSON.stringify({ type: "state", room: E.publicView(r, now) } satisfies ServerMessage);
      for (const ws of this.ctx.getWebSockets()) { try { ws.send(msg); } catch { /* closing */ } }
    }
    await this.ctx.storage.put({ room: r, emptySince: this.emptySince });

    const summary: RoomSummary = {
      code: r.code, host: r.players.find((p) => p.userId === r.hostId)?.name ?? "—",
      players: r.players.length, maxPlayers: r.settings.maxPlayers, status: r.status, topic: r.settings.topic,
      lives: r.settings.lives, isPublic: r.settings.isPublic,
      anyoneConnected: r.players.some((p) => p.connected), createdAt: r.createdAt, updatedAt: now,
    };
    const key = JSON.stringify({ ...summary, updatedAt: 0 });
    if (key !== this.lastSummary) {
      this.lastSummary = key;
      await this.lobby().fetch("https://lobby/upsert", { method: "POST", body: JSON.stringify(summary) });
    }

    // Next wake-up: the fuse/pause deadline, or a sweep while someone is away.
    const deadlines: number[] = [];
    const d = E.nextDeadline(r);
    if (d !== null) deadlines.push(d);
    const someoneAway = r.players.some((p) => !p.connected) || !(r.players.some((p) => p.connected) || r.spectators.some((s) => s.connected));
    if (someoneAway) deadlines.push(now + SWEEP_MS);
    if (deadlines.length) await this.ctx.storage.setAlarm(Math.max(now + 5, Math.min(...deadlines)));
    else await this.ctx.storage.deleteAlarm();
  }

  private lobby() { return this.env.PARTY_LOBBY.get(this.env.PARTY_LOBBY.idFromName("lobby")); }
}

/** Directory of rooms for the public list and quick play. */
export class PartyLobby extends DurableObject<PartyEnv> {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const all = (await this.ctx.storage.get<Record<string, RoomSummary>>("rooms")) ?? {};
    const now = Date.now();
    // Forget rooms that haven't reported for 10 minutes.
    for (const [c, s] of Object.entries(all)) if (now - s.updatedAt > 600_000) delete all[c];

    if (url.pathname === "/upsert") {
      const s = (await req.json()) as RoomSummary;
      all[s.code] = s;
      await this.ctx.storage.put("rooms", all);
      return new Response("ok");
    }
    if (url.pathname === "/remove") {
      const { code } = (await req.json()) as { code: string };
      delete all[code];
      await this.ctx.storage.put("rooms", all);
      return new Response("ok");
    }
    if (url.pathname === "/list") {
      const rooms = Object.values(all)
        .filter((s) => s.isPublic && (s.anyoneConnected || now - s.createdAt < 30_000))
        .sort((a, b) => Number(a.status !== "lobby") - Number(b.status !== "lobby") || b.players - a.players)
        .slice(0, 50)
        .map(({ code, host, players, maxPlayers, status, topic, lives }) => ({ code, host, players, maxPlayers, status, topic, lives }));
      return Response.json({ rooms });
    }
    if (url.pathname === "/quick") {
      const open = Object.values(all).find((s) => s.isPublic && s.status === "lobby" && s.players < s.maxPlayers && s.anyoneConnected);
      return Response.json({ code: open?.code ?? null });
    }
    return new Response("Not found", { status: 404 });
  }
}
