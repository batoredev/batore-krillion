// What the browser is allowed to know about a set before it is finished: prompt text only, no answers.
import type { TopicId } from "@/content/types";
import type { GameSet } from "./sets";

export interface ClientPrompt { id: string; text: string; topic: TopicId }
export interface ClientSet {
  key: string;
  mode: GameSet["mode"];
  title: string;
  subtitle: string;
  dailyNumber?: number;
  prompts: ClientPrompt[];
}

export const toClientSet = (s: GameSet): ClientSet => ({
  key: s.key, mode: s.mode, title: s.title, subtitle: s.subtitle, dailyNumber: s.dailyNumber,
  prompts: s.prompts.map((p) => ({ id: p.id, text: p.text, topic: p.topic })),
});
