"use client";
import Link from "next/link";
import { useState } from "react";
import type { GameSet } from "@/game/sets";
import { BANDS, bandFor, MAX_SCORE, MISS, TIERS, TIER_KEYS, type TierKey } from "@/game/tiers";
import type { Result } from "@/lib/store/types";
import type { Stats } from "@/lib/results";
import { RocketIcon } from "./Logo";

export interface SubmitResponse { result: Result; percentile: { pct: number; players: number } | null; stats: Stats }

const tierHeight = (t: TierKey | null) => (t ? (TIER_KEYS.indexOf(t) + 1) / TIER_KEYS.length : 0);

export function shareText(set: GameSet, result: Result): string {
  const squares = result.rounds.map((r) => (r.tier ? TIERS[r.tier].emoji : MISS.emoji)).join("");
  return `KRIBATOV · ${set.title}\n${result.score}/${MAX_SCORE} km · ${bandFor(result.score).title}\n${squares}`;
}

export function Results({ set, response, nextHref }: { set: GameSet; response: SubmitResponse; nextHref?: string }) {
  const { result, percentile, stats } = response;
  const band = bandFor(result.score);
  const [copied, setCopied] = useState(false);
  const text = shareText(set, result);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };

  return (
    <div className="page stack">
      <section className="hero">
        <div className="row"><span className="eyebrow">{set.title} · launch complete</span></div>
        <div className="row" style={{ alignItems: "flex-end", gap: 16 }}>
          <span className="score-big mono">{result.score}</span>
          <span className="muted" style={{ paddingBottom: 10 }}>/ {MAX_SCORE} km</span>
          <span className="spacer" />
          <RocketIcon size={56} />
        </div>
        <div>
          <h2 className="h2">{band.title}</h2>
          <p className="muted">{band.line}</p>
        </div>
        <div className="progress" aria-hidden="true"><i style={{ width: `${(result.score / MAX_SCORE) * 100}%` }} /></div>
        <div className="row small">
          {percentile
            ? <span className="pill pill-accent">Higher than {percentile.pct}% of {percentile.players - 1} other player{percentile.players === 2 ? "" : "s"}{result.firstAttempt ? "" : " (first runs)"}</span>
            : <span className="pill">You&apos;re the first to finish this set</span>}
          {!result.firstAttempt && <span className="pill">Replay — doesn&apos;t count for leaderboards</span>}
          {result.countsForStreak && <span className="pill pill-accent">🔥 {stats.currentStreak}-day streak</span>}
        </div>
        <div className="row">
          <button className="btn btn-primary" onClick={() => window.location.reload()}>↻ Play this again</button>
          {nextHref && <Link className="btn" href={nextHref}>Next set ▲</Link>}
          {set.mode === "daily" && <Link className="btn" href={`/leaderboard?daily=${set.dailyNumber}`}>🏆 Leaderboard</Link>}
          <Link className="btn btn-ghost" href="/">Home</Link>
        </div>
      </section>

      <section className="card stack">
        <div className="row"><h3 className="h2">Flight log</h3><span className="spacer" /><span className="muted small">taller = rarer</span></div>
        <div className="chart">
          {result.rounds.map((r, i) => (
            <div className="chart-col" key={i}>
              <div className="chart-bar" style={{ height: `${Math.max(3, tierHeight(r.tier) * 100)}%`, background: r.tier ? TIERS[r.tier].color : MISS.color }} title={r.tier ? TIERS[r.tier].name : MISS.name} />
              <small>{i + 1}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card stack">
        <div className="row"><h3 className="h2">Share</h3><span className="spacer" /><button className="btn btn-sm" onClick={copy}>{copied ? "Copied ✓" : "Copy result"}</button></div>
        <div className="share-box">{text}</div>
      </section>

      <section className="card stack">
        <h3 className="h2">Every answer</h3>
        <p className="muted small">Tap a round to see what else was out there.</p>
        <div className="stack" style={{ gap: 8 }}>
          {set.prompts.map((p, i) => <RoundItem key={p.id} n={i + 1} prompt={p} round={result.rounds[i]} />)}
        </div>
      </section>

      <section className="card stack">
        <h3 className="h2">Altitude bands</h3>
        <div className="bands">
          {BANDS.map((b) => (
            <div key={b.title} className={`band ${b === band ? "on" : ""}`}><b>{b.min}–{b.max}</b><span><strong>{b.title}.</strong> {b.line}</span></div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RoundItem({ n, prompt, round }: { n: number; prompt: GameSet["prompts"][number]; round: Result["rounds"][number] }) {
  const [open, setOpen] = useState(false);
  const tier = round.tier ? TIERS[round.tier] : null;
  return (
    <div className="round-item">
      <button className="round-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="n">{n}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="small muted" style={{ display: "block" }}>{prompt.text}</span>
          <strong>{round.answer ?? "—"}</strong>{" "}
          <span className="small" style={{ color: tier?.color ?? MISS.color }}>{tier?.name ?? MISS.name}</span>
        </span>
        <span className="mono" style={{ fontWeight: 700 }}>+{round.points}</span>
        <span aria-hidden="true" className="muted">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="round-body">
          {[...TIER_KEYS].reverse().map((t) => {
            const list = prompt.tiers[t];
            if (!list.length) return null;
            const shown = list.slice(0, t === "gem" ? 1 : 8);
            return (
              <div key={t}>
                <div className="small" style={{ color: TIERS[t].color, fontWeight: 700, marginBottom: 4 }}>
                  {TIERS[t].emoji} {TIERS[t].name} · {TIERS[t].points} <span className="faint">({list.length})</span>
                </div>
                <div className="tier-list">
                  {shown.map((a) => <span key={a.name} style={a.name === round.answer ? { color: "var(--text)", borderColor: TIERS[t].color } : undefined}>{a.name}</span>)}
                  {list.length > shown.length && <span>+{list.length - shown.length} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
