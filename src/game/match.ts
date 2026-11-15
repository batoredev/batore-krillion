import { TIER_KEYS, TIERS, type TierKey } from "./tiers";
import type { Prompt } from "@/content/types";

/*
 * Answer matching. Forgiving on purpose, but never at the cost of matching the wrong answer:
 *   1. exact (case, accents, punctuation, spaces, leading "the/a/an" ignored; number words = digits)
 *   2. singular/plural ("tacos" = "taco", "dishes" = "dish")
 *   3. sound-alike spelling, tuned for Indian transliterations (paneer/panir, shiva/siva, dhokla/dokla…)
 *   4. short forms that point to exactly one answer: a surname ("Kohli"), or a name without
 *      a generic word ("Everest" for Mount Everest, "Kaziranga" for Kaziranga National Park)
 *   5. typos (insertions, deletions, substitutions and swapped letters), scaled by word length
 * If two different answers are equally close, the guess is rejected rather than guessed at.
 */

const NUMBER_WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18",
  nineteen: "19", twenty: "20", thirty: "30", forty: "40", fifty: "50", hundred: "100", thousand: "1000",
  first: "1", second: "2", third: "3", fourth: "4", fifth: "5", sixth: "6", seventh: "7", eighth: "8", ninth: "9", tenth: "10",
  "1st": "1", "2nd": "2", "3rd": "3", "4th": "4", "5th": "5", "6th": "6", "7th": "7", "8th": "8", "9th": "9", "10th": "10",
};
const ROMAN = /^(x{0,3})(ix|iv|v?i{0,3})$/;
const romanValue = (r: string) => {
  const v: Record<string, number> = { i: 1, v: 5, x: 10 };
  let n = 0;
  for (let i = 0; i < r.length; i++) n += v[r[i]] < (v[r[i + 1]] ?? 0) ? -v[r[i]] : v[r[i]];
  return n;
};

/** Lower-case word tokens with accents, punctuation, articles, number words and roman numerals normalised. */
export function tokens(input: string): string[] {
  const t = input
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  while (t.length > 1 && (t[0] === "a" || t[0] === "an")) t.shift();
  const words = t.length > 1 ? t.filter((w) => w !== "the") : t; // "Elizabeth the Second", "The Dark Knight"
  return words.map((w, i) => {
    if (NUMBER_WORDS[w]) return NUMBER_WORDS[w];
    // Roman numerals after a name: "Henry VIII" = "Henry 8", "Elizabeth II" = "Elizabeth 2".
    if (i > 0 && w.length <= 4 && ROMAN.test(w) && w !== "") return String(romanValue(w));
    return w;
  });
}

export const normalize = (input: string) => tokens(input).join("");

/** Phonetic skeleton: folds common spelling variants (especially Indian transliterations) together. */
export function skeleton(key: string): string {
  let s = key
    .replace(/ph/g, "f").replace(/ck/g, "k").replace(/q/g, "k").replace(/x/g, "ks").replace(/w/g, "v").replace(/z/g, "j")
    .replace(/chh/g, "ch").replace(/sh/g, "s").replace(/([bdgkt])h/g, "$1").replace(/c(?!h)/g, "k")
    .replace(/aa/g, "a").replace(/ee/g, "i").replace(/oo/g, "u").replace(/ou/g, "u").replace(/ai/g, "e").replace(/au/g, "o")
    .replace(/y/g, "i")
    .replace(/(.)\1+/g, "$1");
  if (s.length > 3) s = s.replace(/[ah]$/, "");
  return s;
}

/** Damerau–Levenshtein distance (adjacent swaps count as one edit), stopping early past `max`. */
export function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows: number[][] = [Array.from({ length: b.length + 1 }, (_, j) => j)];
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(rows[i - 1][j] + 1, row[j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, rows[i - 2][j - 2] + 1);
      row.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    rows.push(row);
  }
  return rows[a.length][b.length];
}

/** Typos allowed for a word of this length: none up to 3 letters, then 1, 2, 3. */
export const typoAllowance = (len: number) => (len >= 11 ? 3 : len >= 7 ? 2 : len >= 4 ? 1 : 0);

const singular = (k: string) => (k.length > 4 && k.endsWith("es") ? [k.slice(0, -2), k.slice(0, -1)] : k.length > 3 && k.endsWith("s") ? [k.slice(0, -1)] : []);

// Generic words that may be left out ("Everest" for "Mount Everest"), only when what remains is unambiguous.
const GENERIC_PREFIX = ["mount", "mt", "lake", "river", "battle of", "siege of", "operation", "fort", "kingdom of", "empire of", "saint", "st", "sant", "guru", "lord", "king", "queen", "emperor", "maharaja", "raja", "rani", "sultan", "sir", "dr", "pandit", "ustad", "swami", "the battle of"];
const GENERIC_SUFFIX = ["river", "lake", "falls", "waterfall", "fort", "national park", "tiger reserve", "wildlife sanctuary", "bird sanctuary", "sanctuary", "temple", "mandir", "express", "stadium", "empire", "dynasty", "sultanate", "kingdom", "caliphate", "film", "movie", "the movie", "dam", "pass", "la", "glacier", "island", "islands", "beach", "hills", "hill", "range", "mountains", "desert", "sea", "ocean", "strait", "canal", "airport", "international airport", "university", "college", "regiment", "rifles", "party", "movement", "satyagraha", "revolution", "war", "mission", "rally", "grand prix", "gp", "circuit", "festival", "dance", "biryani", "masala"];

// Category words people add to a guess ("parmesan cheese", "ramen noodles", "Kaziranga national park").
const GUESS_EXTRAS = ["cheese", "noodles", "noodle", "pasta", "dish", "curry", "sauce", "bread", "tea", "cake", "soup", "rice", "sweet", "film", "movie", "the movie", "the film", "series", "show", "dog", "breed", "bird", "tree", "flower", "language", "state", "city", "country", "district", "team", "club", "company", "brand", "car", "bike", "motorcycle", "ji", "sahib", "saheb", "national park", "park", "tiger reserve", "sanctuary", "temple", "fort", "palace", "river", "lake", "falls", "mountain", "peak", "island", "beach", "desert", "festival", "dance", "party", "empire", "dynasty"];
const digitsOf = (k: string) => k.replace(/\D/g, "");

export interface MatchResult { tier: TierKey; answer: string; points: number; exact: boolean }

interface Entry { key: string; skel: string; tier: TierKey; answer: string }
interface Index {
  exact: Map<string, Entry>;
  skel: Map<string, Entry[]>;
  short: Map<string, Entry>; // unique surnames and generic-word-stripped forms
  all: Entry[];
}
const indexCache = new Map<string, Index>();
export const clearMatchCache = (promptId?: string) => (promptId ? indexCache.delete(promptId) : indexCache.clear());

function buildIndex(prompt: Prompt): Index {
  const exact = new Map<string, Entry>();
  const skel = new Map<string, Entry[]>();
  const all: Entry[] = [];
  const shortCandidates = new Map<string, Set<string>>(); // key -> answers it could mean
  const shortEntry = new Map<string, Entry>();
  const addShort = (k: string, e: Entry) => {
    if (k.length < 4 || k === e.key) return;
    if (!shortCandidates.has(k)) shortCandidates.set(k, new Set());
    shortCandidates.get(k)!.add(e.answer);
    if (!shortEntry.has(k)) shortEntry.set(k, e);
  };
  for (const tier of TIER_KEYS) {
    for (const a of prompt.tiers[tier]) {
      for (const form of [a.name, ...a.aliases]) {
        const toks = tokens(form);
        const key = toks.join("");
        if (!key) continue;
        const e: Entry = { key, skel: skeleton(key), tier, answer: a.name };
        if (!exact.has(key)) exact.set(key, e);
        const list = skel.get(e.skel) ?? [];
        list.push(e);
        skel.set(e.skel, list);
        all.push(e);
        if (form !== a.name) continue; // short forms come from the display name only, not from aliases
        // Surname / last word of a multi-word name.
        if (toks.length >= 2 && toks.length <= 3 && !/^\d+$/.test(toks[toks.length - 1])) addShort(toks[toks.length - 1], e);
        // Generic words removed.
        const phrase = toks.join(" ");
        for (const p of GENERIC_PREFIX) if (phrase.startsWith(p + " ")) addShort(phrase.slice(p.length + 1).replace(/ /g, ""), e);
        for (const s of GENERIC_SUFFIX) if (phrase.endsWith(" " + s)) addShort(phrase.slice(0, -s.length - 1).replace(/ /g, ""), e);
      }
    }
  }
  const short = new Map<string, Entry>();
  for (const [k, answers] of shortCandidates) if (answers.size === 1 && !exact.has(k)) short.set(k, shortEntry.get(k)!);
  return { exact, skel, short, all };
}

function indexFor(prompt: Prompt): Index {
  let idx = indexCache.get(prompt.id);
  if (!idx) { idx = buildIndex(prompt); indexCache.set(prompt.id, idx); }
  return idx;
}

const result = (e: Entry, exact: boolean): MatchResult => ({ tier: e.tier, answer: e.answer, points: TIERS[e.tier].points, exact });

/** Picks the single closest entry within the allowance; null if nothing is close or two different answers tie. */
function closest(cands: Entry[], key: string, field: "key" | "skel", maxEdits = 3): Entry | null {
  let best: Entry | null = null;
  let bestD = Infinity;
  let tie = false;
  for (const e of cands) {
    const target = e[field];
    if (digitsOf(target) !== digitsOf(key)) continue; // "Dangal 2" is not "Dangal"; "Henry 9" is not "Henry 8"
    if (target[0] !== key[0]) continue; // people almost never mistype the first letter
    const allow = Math.min(maxEdits, typoAllowance(Math.min(target.length, key.length)));
    if (!allow) continue;
    const d = distance(key, target, allow);
    if (d > allow) continue;
    if (d < bestD) { best = e; bestD = d; tie = false; }
    else if (d === bestD && best && e.answer !== best.answer) tie = true;
  }
  return tie ? null : best;
}

/** Find the answer a guess refers to, or null. */
export function matchAnswer(prompt: Prompt, guess: string): MatchResult | null {
  const direct = matchKey(indexFor(prompt), normalize(guess));
  if (direct) return direct;
  // Retry without a category word the player added ("ramen noodles" → "ramen").
  const phrase = tokens(guess).join(" ");
  for (const w of GUESS_EXTRAS) {
    for (const rest of [phrase.endsWith(" " + w) ? phrase.slice(0, -w.length - 1) : "", phrase.startsWith(w + " ") ? phrase.slice(w.length + 1) : ""]) {
      const k = rest.replace(/ /g, "");
      if (k.length >= 3) { const m = matchKey(indexFor(prompt), k, true); if (m) return m; }
    }
  }
  return null;
}

/** strict: exact, plural, sound-alike and short forms only (no typo tolerance). */
function matchKey(idx: Index, key: string, strict = false): MatchResult | null {
  if (!key) return null;

  const hit = idx.exact.get(key);
  if (hit) return result(hit, true);
  for (const k of singular(key)) { const e = idx.exact.get(k); if (e) return result(e, true); }
  for (const e of idx.all) for (const k of singular(e.key)) if (k === key) return result(e, true);

  const sk = skeleton(key);
  const sounds = sk.length >= 4 ? idx.skel.get(sk) : undefined;
  if (sounds && new Set(sounds.map((e) => e.answer)).size === 1) return result(sounds[0], false);

  const shortHit = idx.short.get(key);
  if (shortHit) return result(shortHit, false);

  if (strict) return null;
  const typo = closest(idx.all, key, "key");
  if (typo) return result(typo, false);
  if (sk.length >= 6) {
    const soundTypo = closest(idx.all, sk, "skel", 1);
    if (soundTypo) return result(soundTypo, false);
  }
  // One typo in a unique surname / short form of 7+ letters ("Tendulkr").
  if (key.length >= 7) {
    const shortEntries = [...idx.short.entries()].filter(([k]) => k.length >= 7).map(([k, e]) => ({ ...e, key: k, skel: skeleton(k) }));
    const shortTypo = closest(shortEntries, key, "key", 1);
    if (shortTypo) return result(shortTypo, false);
  }
  return null;
}

export const answerCount = (prompt: Prompt) => TIER_KEYS.reduce((n, t) => n + prompt.tiers[t].length, 0);
