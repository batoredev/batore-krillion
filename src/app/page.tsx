import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { partyEnabled } from "@/party/enabled";
import { statsFor } from "@/lib/results";
import { todayDailyNumber, dateForDaily, prettyDate } from "@/game/time";
import { MAX_SCORE, SECONDS_PER_PROMPT, ROUNDS_PER_SET, TIERS, TIER_KEYS, bandFor } from "@/game/tiers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const stats = await statsFor(user.id);
  const n = todayDailyNumber();
  const played = stats.playedToday;

  return (
    <div className="page stack">
      <section className="hero">
        <span className="eyebrow">Daily #{n} · {prettyDate(dateForDaily(n))}</span>
        <h1 className="title">Today&apos;s launch</h1>
        <p className="muted">{ROUNDS_PER_SET} prompts · {SECONDS_PER_PROMPT} seconds each · rarer answers launch you higher. Same prompts for everyone today.</p>
        {played ? (
          <div className="row">
            <span className="pill pill-accent">✓ Played · {played.score}/{MAX_SCORE} km · {bandFor(played.score).title}</span>
            <Link className="btn" href="/play/daily">Play again</Link>
            <Link className="btn" href={`/leaderboard?daily=${n}`}>🏆 Leaderboard</Link>
          </div>
        ) : (
          <div className="row"><Link className="btn btn-primary btn-lg" href="/play/daily">▲ LAUNCH DAILY #{n}</Link></div>
        )}
        <div className="row small">
          <span className="pill">🔥 Streak {stats.currentStreak}</span>
          <span className="pill">Best streak {stats.bestStreak}</span>
          <span className="pill">Best daily {stats.bestDailyScore}</span>
        </div>
      </section>

      <section className="grid">
        {partyEnabled() && <Link href="/party" className="card mode-card"><span className="icon">☄️</span><h3 className="h2">Hot Comet</h3><p className="muted small">Multiplayer party mode. Name an answer, pass the comet before it blows.</p></Link>}
        <Link href="/play/endless" className="card mode-card"><span className="icon">∞</span><h3 className="h2">Endless</h3><p className="muted small">Fresh mixed-topic sets, as many as you like.</p></Link>
        <Link href="/packs" className="card mode-card"><span className="icon">🧭</span><h3 className="h2">Topic packs</h3><p className="muted small">11 topics from Indian movies to world history. {stats.packs.reduce((a, p) => a + p.completed, 0)} sets cleared.</p></Link>
        <Link href="/archive" className="card mode-card"><span className="icon">🗓️</span><h3 className="h2">Archive</h3><p className="muted small">Every past daily, free to replay.</p></Link>
        <Link href="/how-to-play" className="card mode-card"><span className="icon">📘</span><h3 className="h2">How to play</h3><p className="muted small">Rules, tiers and scoring.</p></Link>
      </section>

      <section className="card stack">
        <h3 className="h2">Rarity tiers</h3>
        <div className="ladder">
          {TIER_KEYS.map((t) => (
            <div key={t} className="ladder-row" style={{ color: "var(--text)" }}>
              <span>{TIERS[t].emoji} {TIERS[t].name} <span className="faint small" style={{ fontWeight: 400 }}>— {TIERS[t].line}</span></span>
              <span className="mono">{TIERS[t].points}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
