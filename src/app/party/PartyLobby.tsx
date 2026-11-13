"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RoomRow { code: string; host: string; players: number; maxPlayers: number; status: string; topic: string; lives: number }
type Topic = { id: string; name: string; icon: string };

export function PartyLobby({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomRow[] | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [s, setS] = useState({ isPublic: true, maxPlayers: 6, lives: 2, topic: "all" });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await fetch("/api/party/rooms").then((x) => x.json()).catch(() => ({ rooms: [] }));
      if (alive) setRooms(r.rooms ?? []);
    };
    load();
    const t = setInterval(load, 4000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const go = async (url: string, payload?: unknown) => {
    setBusy(true); setErr("");
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload ?? {}) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(data.error || "Something went wrong"); setBusy(false); return; }
    router.push(`/party/${data.code}`);
  };
  const topicName = (id: string) => (id === "all" ? "All topics" : topics.find((t) => t.id === id)?.name ?? id);

  return (
    <>
      <section className="grid">
        <div className="card stack">
          <h2 className="h2">Quick play</h2>
          <p className="muted small">Jump into an open public room, or start one if none are waiting.</p>
          <button className="btn btn-primary btn-lg" disabled={busy} onClick={() => go("/api/party/quick")}>☄️ PLAY NOW</button>
        </div>
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); if (code.trim()) router.push(`/party/${code.trim().toUpperCase()}`); }}>
          <h2 className="h2">Join by code</h2>
          <input className="input mono" style={{ textTransform: "uppercase", letterSpacing: ".3em", fontSize: 22, textAlign: "center" }} maxLength={4} placeholder="ABCD" value={code} onChange={(e) => setCode(e.target.value.replace(/[^a-z]/gi, ""))} aria-label="Room code" />
          <button className="btn" disabled={code.length !== 4}>Join room</button>
        </form>
      </section>

      <form className="card stack" onSubmit={(e) => { e.preventDefault(); go("/api/party/rooms", s); }}>
        <h2 className="h2">Host a room</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", alignItems: "end" }}>
          <label className="field">Who can join
            <select className="input" value={s.isPublic ? "public" : "private"} onChange={(e) => setS({ ...s, isPublic: e.target.value === "public" })}>
              <option value="public">Public · listed</option><option value="private">Private · code only</option>
            </select>
          </label>
          <label className="field">Players
            <select className="input" value={s.maxPlayers} onChange={(e) => setS({ ...s, maxPlayers: Number(e.target.value) })}>
              <option value={2}>1v1</option><option value={3}>3</option><option value={6}>4–6</option><option value={10}>8–10</option>
            </select>
          </label>
          <label className="field">Lives
            <select className="input" value={s.lives} onChange={(e) => setS({ ...s, lives: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="field">Topic
            <select className="input" value={s.topic} onChange={(e) => setS({ ...s, topic: e.target.value })}>
              <option value="all">All topics</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
            </select>
          </label>
          <button className="btn btn-primary" disabled={busy}>▲ Host room</button>
        </div>
        {err && <p className="error">{err}</p>}
      </form>

      <section className="card stack">
        <div className="row"><h2 className="h2">Public rooms</h2><span className="spacer" /><span className="faint small">refreshes automatically</span></div>
        {rooms === null ? <p className="muted">Scanning…</p> : rooms.length === 0 ? <p className="muted">No public rooms right now. Host one or hit Play now.</p> : (
          <div className="stack" style={{ gap: 8 }}>
            {rooms.map((r) => (
              <div key={r.code} className="row card card-tight" style={{ boxShadow: "none" }}>
                <span className="mono" style={{ fontWeight: 700, letterSpacing: ".15em" }}>{r.code}</span>
                <span><strong>{r.host}</strong><span className="faint small"> · {topicName(r.topic)} · {r.lives}❤</span></span>
                <span className="spacer" />
                <span className="small muted">{r.players}/{r.maxPlayers} · {r.status === "lobby" ? "in lobby" : r.status === "playing" ? "playing" : "finished"}</span>
                <button className="btn btn-sm" onClick={() => router.push(`/party/${r.code}`)}>{r.status === "lobby" && r.players < r.maxPlayers ? "Join ▸" : "Watch ▸"}</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
