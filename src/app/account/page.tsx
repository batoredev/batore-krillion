import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { statsFor } from "@/lib/results";
import { getStore } from "@/lib/store";
import { setFromKey } from "@/game/sets";
import { MAX_SCORE, MISS, TIERS } from "@/game/tiers";
import { prettyDate } from "@/game/time";
import { AccountActions } from "./AccountActions";

export const dynamic = "force-dynamic";
const MEDALS = ["🎖️", "🛩️", "🧭", "🛰️", "🌟"];

export default async function Account() {
  const user = await requireUser();
  const stats = await statsFor(user.id);
  const history = (await getStore().listResultsForUser(user.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 30);
  return (
    <div className="page stack">
      <span className="eyebrow">Flight record</span>
      <div className="row"><h1 className="title">{user.displayName}</h1><span className="pill">@{user.username}</span>{user.role === "admin" && <span className="pill pill-accent">Admin</span>}</div>

      <section className="card">
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
          <div className="stat"><b className="mono">{stats.currentStreak}</b><span>Current streak</span></div>
          <div className="stat"><b className="mono">{stats.bestStreak}</b><span>Best streak</span></div>
          <div className="stat"><b className="mono">{stats.dailiesPlayed}</b><span>Dailies played</span></div>
          <div className="stat"><b className="mono">{stats.bestDailyScore}</b><span>Best daily</span></div>
          <div className="stat"><b className="mono">{stats.endlessCompleted}</b><span>Endless sets</span></div>
          <div className="stat"><b className="mono">{stats.totalGames}</b><span>Total games</span></div>
        </div>
        <p className="faint small" style={{ marginTop: 12 }}>Streaks count consecutive days on which you played that day&apos;s daily. Days start at midnight IST.</p>
      </section>

      <section className="card stack">
        <h2 className="h2">Badges</h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
          {stats.badges.map((b, i) => (
            <div key={b.name} className={`badge ${b.earned ? "earned" : ""}`}><span className="medal">{MEDALS[i]}</span><strong>{b.name}</strong><span>{b.line}</span></div>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h2 className="h2">Packs</h2>
        <div className="stack" style={{ gap: 10 }}>
          {stats.packs.map((p) => (
            <Link key={p.topic} href={`/packs/${p.topic}`} className="stack" style={{ gap: 4 }}>
              <div className="row small"><span>{p.icon} {p.name}</span><span className="spacer" /><span className="muted mono">{p.completed}/{p.total}</span></div>
              <div className="progress"><i style={{ width: `${(p.completed / p.total) * 100}%` }} /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h2 className="h2">Recent games</h2>
        {history.length === 0 ? <p className="muted">No games yet. <Link href="/play/daily" style={{ textDecoration: "underline" }}>Play today&apos;s daily</Link>.</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Set</th><th>Date</th><th>Rounds</th><th style={{ textAlign: "right" }}>Score</th></tr></thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{setFromKey(r.setKey)?.title ?? r.setKey}</strong>{!r.firstAttempt && <span className="faint small"> · replay</span>}</td>
                    <td className="muted small">{prettyDate(r.playedOnDate)}</td>
                    <td>{r.rounds.map((x) => (x.tier ? TIERS[x.tier].emoji : MISS.emoji)).join("")}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{r.score}/{MAX_SCORE}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AccountActions />
    </div>
  );
}
