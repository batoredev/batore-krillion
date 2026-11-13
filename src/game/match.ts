import { TIER_KEYS, TIERS, type TierKey } from "./tiers";
import type { Prompt } from "@/content/types";

export function normalize(input: string): string {
  return input
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/^\s*(the|a|an)\s+/, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** Levenshtein distance with an early exit once `max` is exceeded. */
export function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Allowed typos for a word of this length: none under 5, 1 for 5–7, 2 for 8+. */
export const typoAllowance = (len: number) => (len >= 8 ? 2 : len >= 5 ? 1 : 0);

export interface MatchResult { tier: TierKey; answer: string; points: number; exact: boolean }

interface IndexEntry { key: string; tier: TierKey; answer: string }
const indexCache = new Map<string, IndexEntry[]>();

function indexFor(prompt: Prompt): IndexEntry[] {
  let idx = indexCache.get(prompt.id);
  if (idx) return idx;
  idx = [];
  for (const tier of TIER_KEYS) {
    for (const a of prompt.tiers[tier]) {
      for (const form of [a.name, ...a.aliases]) {
        const key = normalize(form);
        if (key) idx.push({ key, tier, answer: a.name });
      }
    }
  }
  indexCache.set(prompt.id, idx);
  return idx;
}

/** Find the answer a guess refers to. Exact matches win; otherwise the closest forgiving match. */
export function matchAnswer(prompt: Prompt, guess: string): MatchResult | null {
  const g = normalize(guess);
  if (!g) return null;
  const idx = indexFor(prompt);
  const exact = idx.find((e) => e.key === g);
  if (exact) return { tier: exact.tier, answer: exact.answer, points: TIERS[exact.tier].points, exact: true };
  let best: IndexEntry | null = null;
  let bestD = Infinity;
  for (const e of idx) {
    const allow = typoAllowance(Math.min(e.key.length, g.length));
    if (!allow) continue;
    const d = distance(g, e.key, allow);
    if (d <= allow && d < bestD) { best = e; bestD = d; }
  }
  return best ? { tier: best.tier, answer: best.answer, points: TIERS[best.tier].points, exact: false } : null;
}

export const answerCount = (prompt: Prompt) => TIER_KEYS.reduce((n, t) => n + prompt.tiers[t].length, 0);
