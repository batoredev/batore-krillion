import type { Prompt, TopicId } from "./types";
import automobiles from "./prompts/automobiles";
import globalCuisine from "./prompts/global-cuisine";
import geography from "./prompts/geography";
import history from "./prompts/history";
import currentAffairs from "./prompts/current-affairs";
import generalTrivia from "./prompts/general-trivia";
import indianGeography from "./prompts/indian-geography";
import indianMovies from "./prompts/indian-movies";
import indianCuisine from "./prompts/indian-cuisine";
import indianHistoryPolitics from "./prompts/indian-history-politics";
import indianTrivia from "./prompts/indian-trivia";
import batch2 from "./prompts/batch2";
import { TIER_KEYS } from "@/game/tiers";
import { normalize } from "@/game/match";
// Researched answer lists (scripts/wikidata/build.ts): extra accepted answers per prompt, with tiers.
import gAutomobiles from "./generated/automobiles.json";
import gGlobalCuisine from "./generated/global-cuisine.json";
import gGeography from "./generated/geography.json";
import gHistory from "./generated/history.json";
import gCurrentAffairs from "./generated/current-affairs.json";
import gGeneralTrivia from "./generated/general-trivia.json";
import gIndianGeography from "./generated/indian-geography.json";
import gIndianMovies from "./generated/indian-movies.json";
import gIndianCuisine from "./generated/indian-cuisine.json";
import gIndianHistoryPolitics from "./generated/indian-history-politics.json";
import gIndianTrivia from "./generated/indian-trivia.json";
import gGeneralMovies from "./generated/general-movies.json";

export const ALL_PROMPTS: Prompt[] = [
  ...automobiles, ...globalCuisine, ...geography, ...history, ...currentAffairs, ...generalTrivia,
  ...indianGeography, ...indianMovies, ...indianCuisine, ...indianHistoryPolitics, ...indianTrivia,
  ...batch2,
];

const byId = new Map(ALL_PROMPTS.map((p) => [p.id, p]));

type GeneratedRow = [name: string, tier: number, aliases?: string[]];
const GENERATED = [gAutomobiles, gGlobalCuisine, gGeography, gHistory, gCurrentAffairs, gGeneralTrivia, gIndianGeography,
  gIndianMovies, gIndianCuisine, gIndianHistoryPolitics, gIndianTrivia, gGeneralMovies] as unknown as Record<string, GeneratedRow[]>[];

// Merge researched answers in. Hand-curated answers (and the gem) always win; duplicates are skipped.
for (const g of GENERATED) {
  for (const [pid, rows] of Object.entries(g)) {
    const p = byId.get(pid);
    if (!p) continue;
    const keys = new Set(TIER_KEYS.flatMap((t) => p.tiers[t].flatMap((a) => [a.name, ...a.aliases].map(normalize))));
    for (const [name, ti, alts] of rows) {
      const tier = TIER_KEYS[ti];
      const k = normalize(name);
      if (!tier || tier === "gem" || !k || keys.has(k)) continue;
      const aliases = (alts ?? []).filter((a) => { const ak = normalize(a); return ak && !keys.has(ak); });
      p.tiers[tier].push({ name, aliases });
      keys.add(k);
      aliases.forEach((a) => keys.add(normalize(a)));
    }
  }
}
export const promptById = (id: string) => byId.get(id);
export const promptsByTopic = (topic: TopicId) => ALL_PROMPTS.filter((p) => p.topic === topic);
