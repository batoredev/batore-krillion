// Applies admin-added answers on top of the built-in prompt lists, in memory.
// Pure (no storage access) so it runs in Next.js routes and in Cloudflare Durable Objects alike.
import { promptById } from "./index";
import type { Answer, Prompt } from "./types";
import { clearMatchCache, normalize } from "@/game/match";
import { TIER_KEYS, type TierKey } from "@/game/tiers";

export interface AdditionLike { id: string; promptId: string; answer: string; aliases: string[]; tier: Exclude<TierKey, "gem"> }

const base = new Map<string, Record<TierKey, Answer[]>>(); // original lists, so removals work
let appliedSignature = "";

export function applyAdditions(list: AdditionLike[]) {
  const sig = list.map((a) => a.id).sort().join(",");
  if (sig === appliedSignature) return;
  appliedSignature = sig;
  // Restore originals for every prompt touched before or now.
  const touched = new Set([...base.keys(), ...list.map((a) => a.promptId)]);
  for (const id of touched) {
    const p = promptById(id);
    if (!p) continue;
    if (!base.has(id)) base.set(id, Object.fromEntries(TIER_KEYS.map((t) => [t, [...p.tiers[t]]])) as Record<TierKey, Answer[]>);
    const orig = base.get(id)!;
    for (const t of TIER_KEYS) p.tiers[t] = [...orig[t]];
  }
  for (const a of list) {
    const p = promptById(a.promptId);
    if (!p || !TIER_KEYS.includes(a.tier) || a.tier === ("gem" as TierKey)) continue;
    if (existingKeys(p).has(normalize(a.answer))) continue;
    p.tiers[a.tier].push({ name: a.answer, aliases: a.aliases.filter(Boolean) });
  }
  for (const id of touched) clearMatchCache(id);
}

export function existingKeys(p: Prompt): Set<string> {
  return new Set(TIER_KEYS.flatMap((t) => p.tiers[t].flatMap((a) => [a.name, ...a.aliases].map(normalize))));
}
