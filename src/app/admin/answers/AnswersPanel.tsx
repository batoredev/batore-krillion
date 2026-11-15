"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TIERS } from "@/game/tiers";

type Tier = "ground" | "decoy" | "orbit" | "moonshot" | "deep";
const TIER_OPTIONS: Tier[] = ["ground", "decoy", "orbit", "moonshot", "deep"];
interface Missed { promptId: string; prompt: string; key: string; guess: string; count: number; players: number; last: string }
interface Addition { id: string; promptId: string; prompt: string; answer: string; aliases: string[]; tier: Tier; createdAt: string }
interface PromptRef { id: string; text: string; topic: string }

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function AnswersPanel({ prompts }: { prompts: PromptRef[] }) {
  const [missed, setMissed] = useState<Missed[] | null>(null);
  const [additions, setAdditions] = useState<Addition[]>([]);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [tierFor, setTierFor] = useState<Record<string, Tier>>({});
  const [manual, setManual] = useState({ promptId: "", answer: "", aliases: "", tier: "orbit" as Tier });
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/answers");
    const d = await r.json();
    if (r.ok) { setMissed(d.missed); setAdditions(d.additions); } else setMsg({ text: d.error ?? "Could not load", ok: false });
  }, []);
  useEffect(() => { load(); }, [load]);

  const call = async (method: string, payload: unknown, okText: string) => {
    const r = await fetch("/api/admin/answers", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? { text: okText, ok: true } : { text: d.error ?? "Failed", ok: false });
    if (r.ok) load();
    return r.ok;
  };

  const promptOptions = useMemo(() => {
    const f = filter.toLowerCase();
    return prompts.filter((p) => !f || p.text.toLowerCase().includes(f) || p.topic.toLowerCase().includes(f)).slice(0, 200);
  }, [prompts, filter]);

  return (
    <>
      {msg && <p className={msg.ok ? "success" : "error"} role="status">{msg.text}</p>}

      <section className="card stack">
        <div className="row"><h2 className="h2">Rejected guesses</h2><span className="spacer" /><button className="btn btn-sm" onClick={load}>Refresh</button></div>
        {missed === null ? <p className="muted">Loading…</p> : missed.length === 0 ? <p className="muted">Nothing to review. Rejected guesses will show up here.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Prompt</th><th>Guess</th><th>Players</th><th>Add as</th><th /></tr></thead>
              <tbody>
                {missed.map((m) => {
                  const id = `${m.promptId}|${m.key}`;
                  const tier = tierFor[id] ?? "orbit";
                  return (
                    <tr key={id}>
                      <td className="small">{m.prompt}<div className="faint small">{when(m.last)}</div></td>
                      <td><strong>{m.guess}</strong>{m.count > 1 && <span className="faint small"> ×{m.count}</span>}</td>
                      <td className="mono">{m.players}</td>
                      <td>
                        <select className="input" style={{ minHeight: 34, padding: "0 8px", width: 140 }} value={tier} onChange={(e) => setTierFor({ ...tierFor, [id]: e.target.value as Tier })} aria-label="Tier">
                          {TIER_OPTIONS.map((t) => <option key={t} value={t}>{TIERS[t].emoji} {TIERS[t].name}</option>)}
                        </select>
                      </td>
                      <td>
                        <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                          <button className="btn btn-sm btn-primary" onClick={() => call("POST", { promptId: m.promptId, answer: m.guess, tier, clearKey: m.key }, `Added “${m.guess}”.`)}>✓ Accept</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => call("DELETE", { promptId: m.promptId, key: m.key }, "Dismissed.")}>Dismiss</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card stack">
        <h2 className="h2">Add an answer to any prompt</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", alignItems: "end" }}>
          <label className="field">Find prompt
            <input className="input" placeholder="e.g. sweet, Rajinikanth, river" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </label>
          <label className="field">Prompt
            <select className="input" value={manual.promptId} onChange={(e) => setManual({ ...manual, promptId: e.target.value })}>
              <option value="">Choose a prompt…</option>
              {promptOptions.map((p) => <option key={p.id} value={p.id}>{p.topic}: {p.text}</option>)}
            </select>
          </label>
          <label className="field">Answer
            <input className="input" value={manual.answer} onChange={(e) => setManual({ ...manual, answer: e.target.value })} placeholder="Correct answer" />
          </label>
          <label className="field">Other spellings <span className="faint">(comma-separated, optional)</span>
            <input className="input" value={manual.aliases} onChange={(e) => setManual({ ...manual, aliases: e.target.value })} placeholder="e.g. Bombay, Mumbai" />
          </label>
          <label className="field">Tier
            <select className="input" value={manual.tier} onChange={(e) => setManual({ ...manual, tier: e.target.value as Tier })}>
              {TIER_OPTIONS.map((t) => <option key={t} value={t}>{TIERS[t].emoji} {TIERS[t].name} · {TIERS[t].points}</option>)}
            </select>
          </label>
          <button className="btn btn-primary" disabled={!manual.promptId || !manual.answer.trim()} onClick={async () => {
            const ok = await call("POST", { promptId: manual.promptId, answer: manual.answer, tier: manual.tier, aliases: manual.aliases.split(",") }, `Added “${manual.answer}”.`);
            if (ok) setManual({ ...manual, answer: "", aliases: "" });
          }}>Add answer</button>
        </div>
        <p className="faint small">Pick the tier by how many people would think of it: Ground Control for the obvious ones, Deep Space for the rare ones. The 🌟 gem is fixed per prompt.</p>
      </section>

      <section className="card stack">
        <h2 className="h2">Answers you&apos;ve added ({additions.length})</h2>
        {additions.length === 0 ? <p className="muted">None yet.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Prompt</th><th>Answer</th><th>Tier</th><th /></tr></thead>
              <tbody>
                {additions.map((a) => (
                  <tr key={a.id}>
                    <td className="small">{a.prompt}</td>
                    <td><strong>{a.answer}</strong>{a.aliases.length > 0 && <div className="faint small">also: {a.aliases.join(", ")}</div>}</td>
                    <td><span style={{ color: TIERS[a.tier].color }}>{TIERS[a.tier].emoji} {TIERS[a.tier].name}</span></td>
                    <td><button className="btn btn-sm btn-ghost btn-danger" onClick={() => call("DELETE", { id: a.id }, `Removed “${a.answer}”.`)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
