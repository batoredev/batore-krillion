import Link from "next/link";
import { BANDS, MAX_SCORE, ROUNDS_PER_SET, SECONDS_PER_PROMPT, STREAK_BADGES, TIERS, TIER_KEYS } from "@/game/tiers";

export default function HowToPlay() {
  return (
    <div className="page stack" style={{ maxWidth: 720 }}>
      <span className="eyebrow">How to play</span>
      <h1 className="title">Name the rare one.</h1>
      <div className="card stack">
        <ol className="stack" style={{ paddingLeft: 20, margin: 0 }}>
          <li>Each set has <b>{ROUNDS_PER_SET} prompts</b>, like “Name an Indian sweet”. You get <b>{SECONDS_PER_PROMPT} seconds</b> per prompt.</li>
          <li>Type <b>one</b> answer that fits. If it isn&apos;t on the list, nothing is lost — keep trying until the clock runs out.</li>
          <li>Spelling is forgiving: capitals, accents and punctuation don&apos;t matter, common alternate names count, and small typos are accepted.</li>
          <li><b>Rarer answers score more.</b> Every point lifts your rocket 1 km. A perfect launch reaches {MAX_SCORE} km.</li>
          <li>The answer that feels clever? Lots of people think of it too — that&apos;s a <b>Decoy</b>.</li>
          <li>Everyone gets the same <b>Daily</b>, which resets at midnight IST. Replay anything as often as you like — only your first run at a set counts for streaks and leaderboards.</li>
        </ol>
      </div>
      <div className="card stack">
        <h2 className="h2">Tiers</h2>
        <div className="ladder">
          {TIER_KEYS.map((t) => (
            <div key={t} className="ladder-row" style={{ color: "var(--text)" }}><span>{TIERS[t].emoji} {TIERS[t].name}</span><span>{TIERS[t].points} pts</span></div>
          ))}
        </div>
        <p className="muted small">Each prompt has exactly one 🌟 Kribatov — a hand-picked gem that&apos;s rare but gettable.</p>
      </div>
      <div className="card stack">
        <h2 className="h2">Altitude bands</h2>
        <div className="bands">{BANDS.map((b) => <div className="band" key={b.title}><b>{b.min}–{b.max}</b><span><strong>{b.title}.</strong> {b.line}</span></div>)}</div>
      </div>
      <div className="card stack">
        <h2 className="h2">Streak badges</h2>
        <p className="muted small">Play the daily on its own day to build a streak. Archive replays don&apos;t extend it.</p>
        <div className="row">{STREAK_BADGES.map((b) => <span key={b.name} className="pill">{b.name} · {b.line}</span>)}</div>
      </div>
      <div className="row"><Link href="/play/daily" className="btn btn-primary btn-lg">▲ Play today&apos;s daily</Link></div>
    </div>
  );
}
