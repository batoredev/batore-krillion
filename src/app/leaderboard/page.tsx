import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { leaderboard } from "@/lib/results";
import { getStore } from "@/lib/store";
import { dateForDaily, prettyDate, todayDailyNumber } from "@/game/time";
import { MAX_SCORE, MISS, TIERS } from "@/game/tiers";

export const dynamic = "force-dynamic";

export default async function Leaderboard({ searchParams }: { searchParams: Promise<{ daily?: string; scope?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = todayDailyNumber();
  const n = Math.min(today, Math.max(1, Number(sp.daily) || today));
  const scope = sp.scope === "friends" ? "friends" : "global";
  const rows = await leaderboard(`daily:${n}`, user.id, scope);
  const iPlayed = (await getStore().listResultsForUser(user.id)).some((r) => r.setKey === `daily:${n}`);
  const href = (d: number, s: string) => `/leaderboard?daily=${d}${s === "friends" ? "&scope=friends" : ""}`;

  return (
    <div className="page stack">
      <span className="eyebrow">Leaderboard · first runs only</span>
      <div className="row">
        <h1 className="title">Daily #{n}</h1>
        <span className="spacer" />
        <div className="row">
          {n > 1 && <Link className="btn btn-sm" href={href(n - 1, scope)}>← #{n - 1}</Link>}
          {n < today && <Link className="btn btn-sm" href={href(n + 1, scope)}>#{n + 1} →</Link>}
        </div>
      </div>
      <p className="muted">{prettyDate(dateForDaily(n))}</p>
      <div className="tabs">
        <Link href={href(n, "global")} className={scope === "global" ? "on" : ""}>Everyone</Link>
        <Link href={href(n, "friends")} className={scope === "friends" ? "on" : ""}>Friends</Link>
      </div>
      {!iPlayed && <p className="notice">Play <Link href={n === today ? "/play/daily" : `/play/daily/${n}`} style={{ textDecoration: "underline" }}>Daily #{n}</Link> to see everyone&apos;s answers.</p>}
      <div className="card table-wrap">
        {rows.length === 0 ? <p className="muted">Nobody has finished this daily yet{scope === "friends" ? " among your friends" : ""}.</p> : (
          <table className="table">
            <thead><tr><th>#</th><th>Player</th><th>Rounds</th><th style={{ textAlign: "right" }}>Score</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.userId} className={r.isMe ? "me" : ""}>
                  <td className="mono">{i + 1}</td>
                  <td><strong>{r.displayName}</strong>{r.isMe && <span className="faint small"> (you)</span>}<div className="faint small">@{r.username}</div></td>
                  <td>
                    <span title={iPlayed ? r.rounds.map((x) => x.answer ?? "—").join(" · ") : "Play to reveal answers"}>
                      {r.rounds.map((x) => (x.tier ? TIERS[x.tier].emoji : MISS.emoji)).join("")}
                    </span>
                    {iPlayed && <div className="faint small">{r.rounds.map((x) => x.answer ?? "—").join(" · ")}</div>}
                  </td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{r.score}<span className="faint">/{MAX_SCORE}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
