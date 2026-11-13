import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { leaderboard, statsFor } from "@/lib/results";
import { todayDailyNumber } from "@/game/time";
import { MAX_SCORE } from "@/game/tiers";
import { FriendsManager } from "./FriendsManager";

export const dynamic = "force-dynamic";

export default async function Friends() {
  const user = await requireUser();
  const store = getStore();
  const ids = await store.listFriendIds(user.id);
  const friends = [];
  for (const id of ids) {
    const f = await store.getUserById(id);
    if (!f || f.disabled) continue;
    const s = await statsFor(id);
    friends.push({ id: f.id, username: f.username, displayName: f.displayName, streak: s.currentStreak, today: s.playedToday?.score ?? null });
  }
  const n = todayDailyNumber();
  const board = await leaderboard(`daily:${n}`, user.id, "friends");
  return (
    <div className="page stack">
      <span className="eyebrow">Crew</span>
      <h1 className="title">Friends</h1>
      <p className="muted">Add friends by username to compare daily scores and answers.</p>
      <FriendsManager friends={friends} />
      <section className="card stack">
        <div className="row"><h2 className="h2">Today · Daily #{n}</h2><span className="spacer" /><Link className="btn btn-sm" href={`/leaderboard?daily=${n}&scope=friends`}>Full board</Link></div>
        {board.length === 0 ? <p className="muted">No one in your crew has played today yet.</p> : (
          <div className="stack" style={{ gap: 6 }}>
            {board.map((r, i) => (
              <div key={r.userId} className="row"><span className="mono faint">{i + 1}</span><strong>{r.displayName}</strong>{r.isMe && <span className="faint small">(you)</span>}<span className="spacer" /><span className="mono">{r.score}/{MAX_SCORE}</span></div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
