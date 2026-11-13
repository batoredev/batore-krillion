import { ALL_PROMPTS, promptsByTopic } from "@/content";
import { TOPICS, topicById, type Prompt, type TopicId } from "@/content/types";
import { ROUNDS_PER_SET } from "./tiers";
import { dateForDaily, prettyDate, todayDailyNumber } from "./time";

export const PACK_SETS = 10;

export type Mode = "daily" | "endless" | "pack";
export interface GameSet {
  key: string;          // daily:12 | endless:483920 | pack:indian-movies:3
  mode: Mode;
  title: string;
  subtitle: string;
  prompts: Prompt[];
  dailyNumber?: number;
  topic?: TopicId;
  packIndex?: number;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: string) {
  let a = hashString(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/**
 * 7 prompts from 7 different topics, chosen deterministically from a seed.
 * `asOfDaily` limits the pool to prompts that existed then, so adding content never changes past dailies.
 */
function mixedSet(seed: string, asOfDaily = Infinity): Prompt[] {
  const rand = rng(seed);
  const poolFor = (t: TopicId) => promptsByTopic(t).filter((p) => p.since <= asOfDaily);
  const topics = shuffle(TOPICS.map((t) => t.id).filter((t) => poolFor(t).length > 0), rand);
  const picked: Prompt[] = [];
  for (const t of topics) {
    if (picked.length === ROUNDS_PER_SET) break;
    const pool = poolFor(t);
    picked.push(pool[Math.floor(rand() * pool.length)]);
  }
  // Fewer topics than rounds: top up from everything else.
  const rest = shuffle(ALL_PROMPTS.filter((p) => p.since <= asOfDaily && !picked.includes(p)), rand);
  while (picked.length < ROUNDS_PER_SET && rest.length) picked.push(rest.shift()!);
  return picked;
}

export function dailySet(n: number): GameSet {
  return {
    key: `daily:${n}`, mode: "daily", dailyNumber: n,
    title: `Daily #${n}`, subtitle: prettyDate(dateForDaily(n)),
    prompts: mixedSet(`daily:${n}`, n),
  };
}

export function endlessSet(seed: number): GameSet {
  return { key: `endless:${seed}`, mode: "endless", title: `Endless #${seed}`, subtitle: "Mixed topics", prompts: mixedSet(`endless:${seed}`) };
}

export function packSet(topic: TopicId, index: number): GameSet {
  const t = topicById(topic)!;
  const pool = promptsByTopic(topic);
  return {
    key: `pack:${topic}:${index}`, mode: "pack", topic, packIndex: index,
    title: `${t.name} · Set ${index}`, subtitle: `${t.icon} Topic pack`,
    prompts: shuffle(pool, rng(`pack:${topic}:${index}`)).slice(0, ROUNDS_PER_SET),
  };
}

/** Resolve a set key. Returns null for anything invalid (including future dailies). */
export function setFromKey(key: string): GameSet | null {
  const [mode, a, b] = key.split(":");
  if (mode === "daily") {
    const n = Number(a);
    if (!Number.isInteger(n) || n < 1 || n > todayDailyNumber()) return null;
    return dailySet(n);
  }
  if (mode === "endless") {
    const s = Number(a);
    if (!Number.isInteger(s) || s < 1 || s > 999_999) return null;
    return endlessSet(s);
  }
  if (mode === "pack") {
    const n = Number(b);
    if (!topicById(a) || !Number.isInteger(n) || n < 1 || n > PACK_SETS || promptsByTopic(a as TopicId).length === 0) return null;
    return packSet(a as TopicId, n);
  }
  return null;
}
