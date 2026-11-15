import "server-only";
import { getStore, type Result, type RoundRecord, type User } from "./store";
import { newId } from "./passwords";
import { guessFromProof, revealSet } from "./play";
import { setFromKey, PACK_SETS } from "@/game/sets";
import { matchAnswer } from "@/game/match";
import { STREAK_BADGES } from "@/game/tiers";
import { dateForDaily, istDate, istDayIndex, todayDailyNumber } from "@/game/time";
import { TOPICS } from "@/content/types";

/** proof comes from /api/play/check; rounds without a valid proof score nothing. */
export interface SubmittedRound { promptId: string; proof: string | null }

/** Scores a finished set on the server (never trusts client points) and stores it. */
export async function submitResult(user: User, setKey: string, rounds: SubmittedRound[]) {
  const set = setFromKey(setKey);
  if (!set) throw new Error("Unknown set");
  if (!Array.isArray(rounds) || rounds.length !== set.prompts.length) throw new Error("Wrong number of rounds");

  const scored: RoundRecord[] = [];
  for (let i = 0; i < set.prompts.length; i++) {
    const prompt = set.prompts[i];
    const r = rounds[i];
    if (!r || r.promptId !== prompt.id) throw new Error("Rounds don't match the set");
    const guess = await guessFromProof(r.proof, user, setKey, i);
    const m = guess ? matchAnswer(prompt, guess) : null;
    scored.push({ promptId: prompt.id, guess: m ? guess : null, answer: m?.answer ?? null, tier: m?.tier ?? null, points: m?.points ?? 0 });
  }

  const store = getStore();
  const mine = await store.listResultsForUser(user.id);
  const firstAttempt = !mine.some((r) => r.setKey === setKey);
  const today = istDate();
  const result: Result = {
    id: newId(), userId: user.id, setKey, mode: set.mode,
    dailyNumber: set.dailyNumber ?? null, playedOnDate: today,
    rounds: scored, score: scored.reduce((n, r) => n + r.points, 0),
    firstAttempt,
    countsForStreak: set.mode === "daily" && firstAttempt && dateForDaily(set.dailyNumber!) === today,
    createdAt: new Date().toISOString(),
  };
  await store.addResult(result);
  const percentile = await percentileFor(setKey, result.score, user.id);
  return { result, percentile, stats: await statsFor(user.id), reveal: revealSet(setKey) };
}

/** Share of other players' first attempts at this set that scored lower. Null if nobody else has played. */
export async function percentileFor(setKey: string, score: number, userId: string): Promise<{ pct: number; players: number } | null> {
  const others = (await getStore().listResultsForSet(setKey)).filter((r) => r.firstAttempt && r.userId !== userId);
  if (!others.length) return null;
  return { pct: Math.round((others.filter((r) => r.score < score).length / others.length) * 100), players: others.length + 1 };
}

export interface Stats {
  currentStreak: number;
  bestStreak: number;
  dailiesPlayed: number;
  bestDailyScore: number;
  totalGames: number;
  playedToday: Result | null;
  badges: { name: string; line: string; days: number; earned: boolean }[];
  packs: { topic: string; name: string; icon: string; completed: number; total: number }[];
  endlessCompleted: number;
}

export async function statsFor(userId: string): Promise<Stats> {
  const results = await getStore().listResultsForUser(userId);
  const streakDays = new Set(results.filter((r) => r.countsForStreak).map((r) => Math.floor(Date.parse(r.playedOnDate + "T00:00:00Z") / 86_400_000)));
  const today = istDayIndex();
  let current = 0;
  for (let d = streakDays.has(today) ? today : today - 1; streakDays.has(d); d--) current++;
  let best = 0;
  for (const d of streakDays) {
    if (streakDays.has(d - 1)) continue;
    let len = 0;
    while (streakDays.has(d + len)) len++;
    best = Math.max(best, len);
  }
  const dailyFirsts = results.filter((r) => r.mode === "daily" && r.firstAttempt);
  const todayKey = `daily:${todayDailyNumber()}`;
  const doneSets = new Set(results.map((r) => r.setKey));
  return {
    currentStreak: current,
    bestStreak: best,
    dailiesPlayed: streakDays.size,
    bestDailyScore: dailyFirsts.reduce((m, r) => Math.max(m, r.score), 0),
    totalGames: results.length,
    playedToday: results.find((r) => r.setKey === todayKey && r.firstAttempt) ?? null,
    badges: STREAK_BADGES.map((b) => ({ ...b, earned: best >= b.days })),
    packs: TOPICS.map((t) => ({
      topic: t.id, name: t.name, icon: t.icon, total: PACK_SETS,
      completed: Array.from({ length: PACK_SETS }, (_, i) => `pack:${t.id}:${i + 1}`).filter((k) => doneSets.has(k)).length,
    })),
    endlessCompleted: new Set(results.filter((r) => r.mode === "endless").map((r) => r.setKey)).size,
  };
}

export interface BoardRow { userId: string; displayName: string; username: string; score: number; rounds: RoundRecord[]; createdAt: string; isMe: boolean; isFriend: boolean }

/** First attempts at a set, best first. scope "friends" keeps only the viewer and their friends. */
export async function leaderboard(setKey: string, viewerId: string, scope: "global" | "friends"): Promise<BoardRow[]> {
  const store = getStore();
  const friendIds = new Set(await store.listFriendIds(viewerId));
  const firsts = (await store.listResultsForSet(setKey)).filter((r) => r.firstAttempt);
  const rows: BoardRow[] = [];
  for (const r of firsts) {
    const isMe = r.userId === viewerId, isFriend = friendIds.has(r.userId);
    if (scope === "friends" && !isMe && !isFriend) continue;
    const u = await store.getUserById(r.userId);
    if (!u) continue;
    rows.push({ userId: u.id, displayName: u.displayName, username: u.username, score: r.score, rounds: r.rounds, createdAt: r.createdAt, isMe, isFriend });
  }
  return rows.sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
}

/** Map of setKey -> this player's first-attempt score, for archive and pack listings. */
export async function firstScores(userId: string): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const r of await getStore().listResultsForUser(userId)) if (r.firstAttempt) out[r.setKey] = r.score;
  return out;
}
