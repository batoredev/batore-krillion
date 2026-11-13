import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { firstScores } from "@/lib/results";
import { dateForDaily, prettyDate, todayDailyNumber } from "@/game/time";
import { MAX_SCORE } from "@/game/tiers";

export const dynamic = "force-dynamic";

export default async function Archive() {
  const user = await requireUser();
  const scores = await firstScores(user.id);
  const today = todayDailyNumber();
  const days = Array.from({ length: today }, (_, i) => today - i);
  return (
    <div className="page stack">
      <span className="eyebrow">Archive</span>
      <h1 className="title">Every daily, ever</h1>
      <p className="muted">Replay any past daily for free. Archive plays don&apos;t extend your streak.</p>
      <div className="archive-grid">
        {days.map((n) => {
          const s = scores[`daily:${n}`];
          return (
            <Link key={n} href={n === today ? "/play/daily" : `/play/daily/${n}`} className={`archive-cell ${s !== undefined ? "done" : ""}`}>
              <strong>Daily #{n}{n === today ? " · today" : ""}</strong>
              <span className="muted small">{prettyDate(dateForDaily(n))}</span>
              <span className="small mono">{s !== undefined ? `${s}/${MAX_SCORE} km` : "Not played"}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
