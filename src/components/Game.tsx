"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientSet } from "@/game/client-set";
import { MAX_SCORE, MISS, SECONDS_PER_PROMPT, TIERS, TIER_KEYS, type TierKey } from "@/game/tiers";
import { topicById } from "@/content/types";
import { AltitudeRail } from "./AltitudeRail";
import { Results, type SubmitResponse } from "./Results";

interface Match { tier: TierKey; answer: string; points: number; exact: boolean }
interface Round { promptId: string; guess: string | null; match: Match | null; proof: string | null }
type CheckResponse = ({ ok: true; proof: string } & Match) | { ok: false; reason: "not-on-list" | "time-up" | "bad-token" };

/** Asks the server for this round's timed token (answers are checked on the server, never in the browser). */
async function fetchRoundToken(setKey: string, round: number): Promise<string | null> {
  try {
    const res = await fetch("/api/play/round", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ setKey, round }) });
    return res.ok ? (await res.json()).token : null;
  } catch { return null; }
}
type Phase = "intro" | "countdown" | "playing" | "reveal" | "submitting" | "done" | "error";

export function Game({ set, alreadyPlayed, nextHref }: { set: ClientSet; alreadyPlayed: boolean; nextHref?: string }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [count, setCount] = useState(3);
  const [left, setLeft] = useState(SECONDS_PER_PROMPT);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; bad: boolean } | null>(null);
  const [shake, setShake] = useState(false);
  const [response, setResponse] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const deadline = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const tokenFor = useRef<{ round: number; token: Promise<string | null> } | null>(null);
  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;

  const prompt = set.prompts[idx];
  const score = rounds.reduce((n, r) => n + (r.match?.points ?? 0), 0);
  const isLast = idx === set.prompts.length - 1;

  const finishRound = useCallback((r: Round) => {
    setRounds((prev) => (prev.length > idx ? prev : [...prev, r]));
    setPhase("reveal");
  }, [idx]);

  // 3-2-1 before each prompt (the round's token is fetched during the countdown)
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 3 && tokenFor.current?.round !== idx) tokenFor.current = { round: idx, token: fetchRoundToken(set.key, idx) };
    if (count === 0) {
      deadline.current = Date.now() + SECONDS_PER_PROMPT * 1000;
      setLeft(SECONDS_PER_PROMPT);
      setPhase("playing");
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [phase, count]);

  // The clock
  useEffect(() => {
    if (phase !== "playing") return;
    inputRef.current?.focus();
    const t = setInterval(() => {
      const ms = deadline.current - Date.now();
      setLeft(Math.max(0, Math.ceil(ms / 1000)));
      if (ms <= 0) {
        clearInterval(t);
        finishRound({ promptId: prompt.id, guess: null, match: null, proof: null });
      }
    }, 100);
    return () => clearInterval(t);
  }, [phase, prompt, finishRound]);

  const start = () => { tokenFor.current = null; setIdx(0); setRounds([]); setCount(3); setPhase("countdown"); };

  const submitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== "playing" || checking) return;
    const g = guess.trim();
    if (!g) return;
    const round = idx;
    setChecking(true);
    let out: CheckResponse;
    try {
      let token = await tokenFor.current?.token;
      if (!token) { tokenFor.current = { round, token: fetchRoundToken(set.key, round) }; token = await tokenFor.current.token; }
      const res = await fetch("/api/play/check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, guess: g }) });
      out = res.ok ? await res.json() : { ok: false, reason: "bad-token" };
    } catch {
      out = { ok: false, reason: "bad-token" };
    }
    setChecking(false);
    if (phaseRef.current !== "playing" || round !== idx) return; // the clock ran out meanwhile
    if (out.ok) {
      finishRound({ promptId: prompt.id, guess: g, match: { tier: out.tier, answer: out.answer, points: out.points, exact: out.exact }, proof: out.proof });
      return;
    }
    const text = out.reason === "not-on-list" ? `“${g}” isn't on the list. Try again.`
      : out.reason === "time-up" ? "Time's up for this one." : "Connection problem. Try again.";
    setFeedback({ text, bad: true });
    setShake(true);
    setTimeout(() => setShake(false), 350);
    setGuess("");
    inputRef.current?.focus();
  };

  const next = async () => {
    setGuess("");
    setFeedback(null);
    if (!isLast) {
      setIdx((i) => i + 1);
      setCount(3);
      setPhase("countdown");
      return;
    }
    setPhase("submitting");
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ setKey: set.key, rounds: rounds.map((r) => ({ promptId: r.promptId, proof: r.proof })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save your result");
      setResponse(data);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your result");
      setPhase("error");
    }
  };

  // Enter moves on from the reveal screen
  useEffect(() => {
    if (phase !== "reveal") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); next(); } };
    const t = setTimeout(() => window.addEventListener("keydown", onKey), 400);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "done" && response) {
    return <Results set={set} response={response} nextHref={nextHref} />;
  }

  const current = rounds[idx];
  const topic = prompt ? topicById(prompt.topic) : null;

  return (
    <div className="page">
      <div className="game">
        <AltitudeRail score={score} />
        <section className="stage" aria-live="polite">
          {phase === "intro" && (
            <div className="stack">
              <span className="eyebrow">{set.subtitle}</span>
              <h1 className="title">{set.title}</h1>
              <p className="muted">
                {set.prompts.length} prompts · {SECONDS_PER_PROMPT} seconds each. Name one thing that fits — the rarer your answer, the higher you launch.
                Wrong answers don&apos;t cost you anything; keep trying until the clock runs out.
              </p>
              {alreadyPlayed && (
                <p className="notice">You&apos;ve already played this set. Replays are unlimited, but only your first run counts for streaks and leaderboards.</p>
              )}
              <div className="row"><button className="btn btn-primary btn-lg" onClick={start} autoFocus>▲ LAUNCH</button></div>
            </div>
          )}

          {(phase === "countdown" || phase === "playing") && prompt && (
            <div className="stack">
              <div className="stage-head">
                <span className="pill">Prompt {idx + 1} of {set.prompts.length}</span>
                {topic && <span className="pill">{topic.icon} {topic.name}</span>}
              </div>
              <h2 className="prompt-text">{prompt.text}</h2>
              {phase === "countdown" ? (
                <div className="countdown" key={count}>{count || "GO"}</div>
              ) : (
                <>
                  <form className={`answer-form ${shake ? "shake" : ""}`} onSubmit={submitGuess}>
                    <label className="sr-only" htmlFor="answer">Your answer</label>
                    <input id="answer" ref={inputRef} className="input" value={guess} onChange={(e) => setGuess(e.target.value)}
                      autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} maxLength={80} placeholder="Type an answer…" enterKeyHint="go" />
                    <button className="btn btn-primary" type="submit" disabled={checking}>{checking ? "…" : "GO"}</button>
                  </form>
                  <div className="row">
                    <Timer left={left} />
                    <p className={`feedback ${feedback?.bad ? "bad" : ""}`}>{feedback?.text ?? "Rarer answers launch you higher."}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {phase === "reveal" && current && (
            <div className="stack reveal">
              <div className="stage-head">
                <span className="pill">Prompt {idx + 1} of {set.prompts.length}</span>
                <span className="muted small">{prompt.text}</span>
              </div>
              {current.match ? (
                <div className={current.match.tier === "gem" ? "gem-burst" : ""}>
                  <div className="reveal-tier" style={{ color: TIERS[current.match.tier].color }}>{TIERS[current.match.tier].name}</div>
                  <div className="reveal-answer">{current.match.answer}</div>
                  <div className="reveal-points">+{current.match.points} pts <span className="muted small">· climb {current.match.points} km</span></div>
                  <p className="muted">{TIERS[current.match.tier].line}</p>
                  {!current.match.exact && <p className="faint small">You typed “{current.guess}”.</p>}
                </div>
              ) : (
                <div>
                  <div className="reveal-tier" style={{ color: MISS.color }}>{MISS.name}</div>
                  <div className="reveal-answer">+0 pts</div>
                  <p className="muted">{MISS.line}</p>
                </div>
              )}
              <div className="ladder" aria-label="Rarity tiers">
                {TIER_KEYS.map((t) => (
                  <div key={t} className={`ladder-row ${current.match?.tier === t ? "lit" : ""}`} style={{ ["--tier" as string]: TIERS[t].color }}>
                    <span>{TIERS[t].emoji} {TIERS[t].name}</span><span>{TIERS[t].points}</span>
                  </div>
                ))}
              </div>
              <div className="row">
                <button className="btn btn-primary btn-lg" onClick={next} autoFocus>{isLast ? "SEE RESULTS ▲" : "NEXT PROMPT ▲"}</button>
                <span className="faint small mono">Total {score}/{MAX_SCORE}</span>
              </div>
            </div>
          )}

          {phase === "submitting" && <p className="muted">Calculating your altitude…</p>}
          {phase === "error" && (
            <div className="stack">
              <p className="error">{error}</p>
              <div className="row"><button className="btn btn-primary" onClick={next}>Try again</button></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Timer({ left }: { left: number }) {
  const r = 28, c = 2 * Math.PI * r;
  const frac = left / SECONDS_PER_PROMPT;
  const low = left <= 5;
  return (
    <div className={`timer ${low ? "low" : ""}`} role="timer" aria-label={`${left} seconds left`}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} stroke="rgba(150,168,255,.18)" strokeWidth="5" fill="none" />
        <circle cx="32" cy="32" r={r} stroke={low ? "var(--bad)" : "var(--accent)"} strokeWidth="5" fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} style={{ transition: "stroke-dashoffset .2s linear" }} />
      </svg>
      <b>{left}</b>
    </div>
  );
}
