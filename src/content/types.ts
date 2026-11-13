import type { TierKey } from "@/game/tiers";
import { normalize } from "@/game/match";

export const TOPICS = [
  { id: "automobiles", name: "Automobiles", icon: "🚗" },
  { id: "global-cuisine", name: "Global Cuisine", icon: "🍜" },
  { id: "geography", name: "Geography", icon: "🌍" },
  { id: "history", name: "History", icon: "🏛️" },
  { id: "current-affairs", name: "Current Affairs", icon: "📰" },
  { id: "general-trivia", name: "General Trivia", icon: "💡" },
  { id: "indian-geography", name: "Indian Geography", icon: "🗺️" },
  { id: "indian-movies", name: "Indian Movies", icon: "🎬" },
  { id: "indian-cuisine", name: "Indian Cuisine", icon: "🍛" },
  { id: "indian-history-politics", name: "Indian History & Politics", icon: "⚖️" },
  { id: "indian-trivia", name: "Indian Trivia", icon: "🇮🇳" },
  { id: "general-movies", name: "General Movies", icon: "🎥" },
] as const;
export type TopicId = (typeof TOPICS)[number]["id"];
export const topicById = (id: string) => TOPICS.find((t) => t.id === id);

/** One answer: display name first, then aliases. */
export interface Answer { name: string; aliases: string[] }

export interface Prompt {
  id: string;
  topic: TopicId;
  text: string;
  tiers: Record<TierKey, Answer[]>;
  /** First daily number this prompt may appear in. Keeps past dailies stable when content is added. */
  since: number;
}

/**
 * Compact authoring helper.
 * Each tier is a string of answers separated by ";" and each answer may list aliases with "|".
 *   p("ic-1", "indian-cuisine", "Name a type of biryani", { ground: "Hyderabadi biryani|hyderabadi; ...", ..., gem: "Ambur biryani" })
 */
export function p(id: string, topic: TopicId, text: string, tiers: Record<TierKey, string>): Prompt {
  const parse = (s: string): Answer[] =>
    s.split(";").map((x) => x.trim()).filter(Boolean).map((x) => {
      const [name, ...aliases] = x.split("|").map((y) => y.trim()).filter(Boolean);
      return { name, aliases };
    });
  // If an answer is listed in more than one tier, the highest tier wins.
  const order: TierKey[] = ["gem", "deep", "moonshot", "orbit", "decoy", "ground"];
  const seen = new Set<string>();
  const out = {} as Record<TierKey, Answer[]>;
  for (const t of order) {
    out[t] = parse(tiers[t]).filter((a) => {
      const keys = [a.name, ...a.aliases].map(normalize);
      if (keys.some((k) => seen.has(k))) return false;
      keys.forEach((k) => seen.add(k));
      return true;
    });
  }
  return { id, topic, text, tiers: out, since: 1 };
}

/** Mark a batch of prompts as available from a given daily number onwards. */
export const fromDaily = (since: number, prompts: Prompt[]): Prompt[] => prompts.map((x) => ({ ...x, since }));
