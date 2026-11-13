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

export const ALL_PROMPTS: Prompt[] = [
  ...automobiles, ...globalCuisine, ...geography, ...history, ...currentAffairs, ...generalTrivia,
  ...indianGeography, ...indianMovies, ...indianCuisine, ...indianHistoryPolitics, ...indianTrivia,
];

const byId = new Map(ALL_PROMPTS.map((p) => [p.id, p]));
export const promptById = (id: string) => byId.get(id);
export const promptsByTopic = (topic: TopicId) => ALL_PROMPTS.filter((p) => p.topic === topic);
