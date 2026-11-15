"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicRoom } from "@/party/engine";
import { TIERS } from "@/game/tiers";

type Topic = { id: string; name: string; icon: string };
type Outcome = { ok: boolean; reason?: string; answer?: string; tier?: keyof typeof TIERS; error?: string };

export function PartyRoom({ code, me, topics, transport }: { code: string; me: string; topics: Topic[]; transport: "memory" | "do" }) {
  const router = useRouter();
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [gone, setGone] = useState(false);
  const [received, setReceived] = useState(0);
  const [now, setNow] = useState(0);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; bad: boolean } | null>(null);
  const [shake, setShake] = useState(false);
  const [boom, setBoom] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const lastPop = useRef(0);
  const lastTyping = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Connection: Server-Sent Events + POST on a single Node server, a WebSocket to the room's Durable Object on Cloudflare.
  const conn = useRef<{ send: (payload: unknown) => Promise<Outcome> } | null>(null);
  useEffect(() => {
    const onState = (r: PublicRoom) => { setRoom(r); setReceived(Date.now()); };
    if (transport === "memory") {
      const es = new EventSource(`/api/party/${code}/events`);
      es.addEventListener("state", (e) => onState(JSON.parse((e as MessageEvent).data)));
      es.addEventListener("gone", () => { setGone(true); es.close(); });
      conn.current = {
        send: async (payload) => {
          const res = await fetch(`/api/party/${code}/action`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
          return res.json().catch(() => ({ ok: false, error: "Network error" }));
        },
      };
      return () => es.close();
    }
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let nextId = 1;
    const pending = new Map<number, (o: Outcome) => void>();
    const connect = async () => {
      try {
        const r = await fetch(`/api/party/${code}/ticket`);
        if (!r.ok) throw new Error("ticket");
        const { url } = await r.json();
        ws = new WebSocket(`${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}${url}`);
      } catch { if (!closed) retry = setTimeout(connect, 2000); return; }
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.type === "state") onState(m.room);
        else if (m.type === "result") { pending.get(m.id)?.(m.out); pending.delete(m.id); }
        else if (m.type === "gone") { closed = true; setGone(true); }
      };
      ws.onclose = () => {
        for (const res of pending.values()) res({ ok: false, error: "Reconnecting…" });
        pending.clear();
        if (!closed) retry = setTimeout(connect, 1500);
      };
    };
    connect();
    conn.current = {
      send: (payload) => new Promise<Outcome>((resolve) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return resolve({ ok: false, error: "Reconnecting…" });
        const id = nextId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ ...(payload as object), id }));
        setTimeout(() => { if (pending.has(id)) { pending.delete(id); resolve({ ok: false, error: "Timed out" }); } }, 8000);
      }),
    };
    return () => { closed = true; clearTimeout(retry); ws?.close(); };
  }, [code, transport]);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);

  // Explosion overlay when a new pop arrives
  useEffect(() => {
    const pop = room?.log.filter((l) => l.type === "pop").at(-1);
    if (pop && pop.t > lastPop.current) {
      if (room!.status === "playing" && (lastPop.current !== 0 || Date.now() - pop.t < 4000)) {
        const who = room!.players.find((p) => p.userId === pop.userId)?.name ?? "Someone";
        setBoom(pop.userId === me ? "💥 It blew up on you!" : `💥 ${who} got caught!`);
        setTimeout(() => setBoom(null), 2600);
      }
      lastPop.current = pop.t;
    }
  }, [room, me]);

  const myTurn = room?.status === "playing" && room.holderId === me && !room.paused;
  useEffect(() => { if (myTurn) { setText(""); setFeedback(null); inputRef.current?.focus(); } }, [myTurn, room?.prompt?.id]);

  const send = useCallback((payload: unknown): Promise<Outcome> =>
    conn.current ? conn.current.send(payload) : Promise.resolve({ ok: false, error: "Connecting…" }), []);

  const onType = (v: string) => {
    setText(v);
    if (Date.now() - lastTyping.current > 180) { lastTyping.current = Date.now(); send({ type: "typing", text: v }); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const g = text.trim();
    if (!g || !myTurn) return;
    const out = await send({ type: "answer", text: g });
    if (out.ok) { setText(""); setFeedback(null); return; }
    const msg = out.reason === "used" ? `“${out.answer}” has already been said.` : out.reason === "invalid" ? `“${g}” isn't on the list.` : out.reason === "not-your-turn" ? "Too late, the comet moved on." : "Hold on…";
    setFeedback({ text: msg, bad: true });
    setShake(true); setTimeout(() => setShake(false), 350);
    setText("");
  };

  const leave = async () => { await send({ type: "leave" }); router.push("/party"); };
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* blocked */ } };

  if (gone) return (
    <div className="page stack"><h1 className="title">Room {code} not found</h1><p className="muted">It may have ended or the code is wrong.</p><Link className="btn btn-primary" href="/party">Back to Party</Link></div>
  );
  if (!room) return <div className="page"><p className="muted">Connecting to room {code}…</p></div>;

  const isHost = room.hostId === me;
  const amPlayer = room.players.some((p) => p.userId === me);
  const holder = room.players.find((p) => p.userId === room.holderId);
  const topicLabel = room.settings.topic === "all" ? "All topics" : (() => { const t = topics.find((x) => x.id === room.settings.topic); return t ? `${t.icon} ${t.name}` : room.settings.topic; })();
  const holdSecs = Math.floor((room.holderForMs + Math.max(0, now - received)) / 1000);

  return (
    <div className="page stack">
      <div className="row">
        <span className="eyebrow">Hot Comet · room</span>
        <span className="pill mono" style={{ letterSpacing: ".2em", fontSize: 14 }}>{room.code}</span>
        <span className="pill">{room.settings.isPublic ? "Public" : "Private"}</span>
        <span className="pill">{topicLabel}</span>
        <span className="spacer" />
        <button className="btn btn-sm" onClick={copyLink}>{copied ? "Link copied ✓" : "Copy invite link"}</button>
        <button className="btn btn-sm btn-ghost btn-danger" onClick={leave}>Leave</button>
      </div>

      {room.status === "lobby" && (
        <Lobby room={room} me={me} isHost={isHost} topics={topics} send={send} />
      )}

      {room.status === "playing" && (
        <>
          <section className={`hero comet-stage ${myTurn ? "my-turn" : ""}`}>
            <div className="row small">
              <span className="pill">{room.prompt ? (topics.find((t) => t.id === room.prompt!.topic)?.icon ?? "") + " " + (topics.find((t) => t.id === room.prompt!.topic)?.name ?? "") : ""}</span>
              <span className="spacer" />
              {room.paused ? <span className="pill">New prompt incoming…</span> : <span className="pill pill-accent fuse">🔥 fuse burning · {holder?.name ?? "—"} has held it {holdSecs}s</span>}
            </div>
            <h1 className="prompt-text">{room.prompt?.text}</h1>
            {myTurn ? (
              <>
                <form className={`answer-form ${shake ? "shake" : ""}`} onSubmit={submit}>
                  <label className="sr-only" htmlFor="party-answer">Your answer</label>
                  <input id="party-answer" ref={inputRef} className="input" value={text} onChange={(e) => onType(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} maxLength={60} placeholder="Quick — name one!" enterKeyHint="send" />
                  <button className="btn btn-primary">PASS ☄️</button>
                </form>
                <p className={`feedback ${feedback?.bad ? "bad" : ""}`}>{feedback?.text ?? "You have the comet! Name an unused answer to pass it."}</p>
              </>
            ) : (
              <div className="typing-line">
                {room.paused ? <span className="muted">Next up: <strong>{holder?.name}</strong></span>
                  : <><span className="muted">{holder?.name} is typing: </span><span className="typing">{room.typing || "…"}</span></>}
              </div>
            )}
          </section>

          <section className="party-players">
            {room.players.map((p) => (
              <div key={p.userId} className={`pcard ${p.userId === room.holderId ? "holder" : ""} ${!p.alive ? "out" : ""} ${p.userId === me ? "me" : ""}`}>
                <div className="pcard-comet" aria-hidden="true">{p.userId === room.holderId ? "☄️" : !p.alive ? "💫" : "🧑‍🚀"}</div>
                <strong>{p.name}{p.userId === me ? " (you)" : ""}</strong>
                <span className="lives" aria-label={`${p.lives} lives`}>{p.alive ? "❤️".repeat(p.lives) : "out"}</span>
                <span className="faint small">{p.answers} {p.answers === 1 ? "answer" : "answers"}{!p.connected ? " · offline" : ""}</span>
              </div>
            ))}
          </section>

          <section className="card stack">
            <div className="row"><h2 className="h2">Said so far</h2><span className="faint small">({room.used.length})</span></div>
            {room.used.length === 0 ? <p className="muted small">Nothing yet for this prompt.</p> : (
              <div className="tier-list">
                {[...room.used].reverse().map((u) => (
                  <span key={u.answer} style={{ borderColor: TIERS[u.tier].color, color: "var(--text)" }} title={`${TIERS[u.tier].name} · ${room.players.find((p) => p.userId === u.by)?.name ?? ""}`}>
                    {TIERS[u.tier].emoji} {u.answer}
                  </span>
                ))}
              </div>
            )}
          </section>
          {!amPlayer && <p className="notice">You&apos;re watching. You&apos;ll be able to join when the host opens the next round.</p>}
        </>
      )}

      {room.status === "finished" && <Finished room={room} me={me} isHost={isHost} send={send} />}

      <Feed room={room} />
      {boom && room.status === "playing" && <div className="boom" role="alert"><div>{boom}</div></div>}
    </div>
  );
}

function Lobby({ room, me, isHost, topics, send }: { room: PublicRoom; me: string; isHost: boolean; topics: Topic[]; send: (p: unknown) => Promise<Outcome> }) {
  const [err, setErr] = useState("");
  const s = room.settings;
  const change = async (patch: Record<string, unknown>) => { const r = await send({ type: "settings", settings: patch }); setErr(r.ok ? "" : r.error ?? ""); };
  const connected = room.players.filter((p) => p.connected).length;
  return (
    <>
      <section className="hero">
        <h1 className="title">Waiting for players</h1>
        <p className="muted">Share the code <strong className="mono" style={{ letterSpacing: ".2em" }}>{room.code}</strong> or the invite link. {connected}/{s.maxPlayers} here.</p>
        <div className="party-players">
          {room.players.map((p) => (
            <div key={p.userId} className={`pcard ${p.userId === me ? "me" : ""} ${!p.connected ? "out" : ""}`}>
              <div className="pcard-comet" aria-hidden="true">{p.userId === room.hostId ? "👑" : "🧑‍🚀"}</div>
              <strong>{p.name}{p.userId === me ? " (you)" : ""}</strong>
              <span className="faint small">{p.userId === room.hostId ? "Host" : p.connected ? "Ready" : "Reconnecting…"}</span>
            </div>
          ))}
        </div>
        {isHost ? (
          <div className="row">
            <button className="btn btn-primary btn-lg" disabled={connected < 2} onClick={async () => { const r = await send({ type: "start" }); setErr(r.ok ? "" : r.error ?? ""); }}>☄️ START GAME</button>
            {connected < 2 && <span className="muted small">Need at least 2 players.</span>}
          </div>
        ) : <p className="muted">Waiting for the host to start…</p>}
        {err && <p className="error">{err}</p>}
      </section>
      <section className="card stack">
        <h2 className="h2">Room settings</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          <label className="field">Lives
            <select className="input" disabled={!isHost} value={s.lives} onChange={(e) => change({ lives: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </label>
          <label className="field">Max players
            <select className="input" disabled={!isHost} value={s.maxPlayers} onChange={(e) => change({ maxPlayers: Number(e.target.value) })}>{[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </label>
          <label className="field">Topic
            <select className="input" disabled={!isHost} value={s.topic} onChange={(e) => change({ topic: e.target.value })}>
              <option value="all">All topics</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
            </select>
          </label>
          <label className="field">Fuse (seconds)
            <select className="input" disabled={!isHost} value={`${s.fuseMinMs}-${s.fuseMaxMs}`} onChange={(e) => { const [a, b] = e.target.value.split("-").map(Number); change({ fuseMinMs: a, fuseMaxMs: b, minFuseOnPassMs: Math.min(8000, a) }); }}>
              <option value="10000-30000">10–30 (standard)</option><option value="6000-18000">6–18 (frantic)</option><option value="15000-45000">15–45 (relaxed)</option>
            </select>
          </label>
          <label className="field">Visibility
            <select className="input" disabled={!isHost} value={s.isPublic ? "1" : "0"} onChange={(e) => change({ isPublic: e.target.value === "1" })}><option value="1">Public</option><option value="0">Private</option></select>
          </label>
        </div>
        <p className="faint small">The fuse length is random within the range and hidden. When you pass with less than {Math.round(s.minFuseOnPassMs / 1000)}s left, it&apos;s topped back up to {Math.round(s.minFuseOnPassMs / 1000)}s.</p>
      </section>
    </>
  );
}

function Finished({ room, me, isHost, send }: { room: PublicRoom; me: string; isHost: boolean; send: (p: unknown) => Promise<Outcome> }) {
  const winner = room.players.find((p) => p.userId === room.winnerId);
  const standings = [...room.players].sort((a, b) => (a.placedAt ?? 99) - (b.placedAt ?? 99));
  return (
    <section className="hero">
      <span className="eyebrow">Game over</span>
      <h1 className="title">{winner ? (winner.userId === me ? "🏆 You win!" : `🏆 ${winner.name} wins!`) : "Game over"}</h1>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>#</th><th>Player</th><th>Said</th><th>Rarest</th><th style={{ textAlign: "right" }}>Pts</th></tr></thead>
          <tbody>
            {standings.map((p) => (
              <tr key={p.userId} className={p.userId === me ? "me" : ""}>
                <td className="mono">{p.placedAt ?? "—"}</td>
                <td><strong>{p.name}</strong></td>
                <td className="mono">{p.answers}</td>
                <td style={{ whiteSpace: "nowrap" }}>{p.bestTier ? <span style={{ color: TIERS[p.bestTier].color }} title={TIERS[p.bestTier].name}>{TIERS[p.bestTier].emoji}<span className="hide-sm"> {TIERS[p.bestTier].name}</span></span> : "—"}</td>
                <td className="mono" style={{ textAlign: "right" }}>{p.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row">
        {isHost ? <button className="btn btn-primary btn-lg" onClick={() => send({ type: "lobby" })}>↻ Play again</button> : <span className="muted">Waiting for the host to start another round…</span>}
        <Link href="/party" className="btn btn-ghost">Back to Party</Link>
      </div>
    </section>
  );
}

function Feed({ room }: { room: PublicRoom }) {
  const name = (id: string) => room.players.find((p) => p.userId === id)?.name ?? room.spectators.find((s) => s.userId === id)?.name ?? "Someone";
  const lines = [...room.log].reverse().slice(0, 10).map((l, i) => {
    switch (l.type) {
      case "answer": return <li key={i}><strong>{name(l.userId)}</strong> said <span style={{ color: TIERS[l.tier].color }}>{l.answer}</span> <span className="faint">({TIERS[l.tier].name})</span></li>;
      case "pop": return <li key={i}>💥 <strong>{name(l.userId)}</strong> got caught · {l.livesLeft} {l.livesLeft === 1 ? "life" : "lives"} left</li>;
      case "out": return <li key={i}>💫 <strong>{name(l.userId)}</strong> is out</li>;
      case "win": return <li key={i}>🏆 <strong>{name(l.userId)}</strong> wins</li>;
      case "prompt": return <li key={i} className="faint">New prompt: {l.text}</li>;
      case "join": return <li key={i} className="faint">{name(l.userId)} joined</li>;
      case "leave": return <li key={i} className="faint">{name(l.userId)} left</li>;
    }
  });
  if (!lines.length) return null;
  return <section className="card"><h2 className="h2" style={{ marginBottom: 8 }}>Comms log</h2><ul className="feed">{lines}</ul></section>;
}
