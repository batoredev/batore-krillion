// Research step: runs every prompt's Wikidata query and writes the accepted-answer lists to
// src/content/generated/<topic>.json. Curated answers (tiers, gems) always win; Wikidata only adds.
// Tiers for new answers come from how widely known each item is (Wikipedia language editions),
// calibrated against the hand-curated tiers of the same prompt.
//   npx tsx scripts/wikidata/build.ts [promptId ...]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { sparql } from "./wdqs";
import { OVERRIDES, SPECS, type Spec } from "./specs";
import { ALL_PROMPTS, promptById } from "../../src/content";
import { normalize } from "../../src/game/match";
import { TIER_KEYS, type TierKey } from "../../src/game/tiers";

const ids: Record<string, { id: string }> = existsSync("scripts/wikidata/ids.json") ? JSON.parse(readFileSync("scripts/wikidata/ids.json", "utf8")) : {};
const qid = (label: string) => OVERRIDES[label] ?? ids[label]?.id ?? "Q0";
const fill = (q: string) => q.replace(/\{([^{}\s?][^{}]*)\}/g, (_, l) => `wd:${qid(l)}`);
const RAW = "scripts/wikidata/raw";
mkdirSync(RAW, { recursive: true });

interface Item { label: string; links: number; alts: string[] }

async function fetchSpec(s: Spec): Promise<Item[]> {
  const cache = `${RAW}/${s.id}.json`;
  if (existsSync(cache) && !process.env.REFRESH) return JSON.parse(readFileSync(cache, "utf8"));
  // Category filter first (fast on WDQS), then popularity and English names via the label service.
  const q = `SELECT ?item ?itemLabel ?itemAltLabel ?links WHERE {
    ${fill(s.q)}
    ?item wikibase:sitelinks ?links. FILTER(?links >= ${s.min ?? 1})
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } LIMIT 40000`;
  const rows = await sparql(q);
  const byItem = new Map<string, Item>();
  for (const r of rows) {
    const id = r.item.value;
    if (byItem.has(id)) continue;
    byItem.set(id, { label: r.itemLabel?.value ?? "", links: Number(r.links.value), alts: r.itemAltLabel?.value ? r.itemAltLabel.value.split(", ") : [] });
  }
  const items = [...byItem.values()].sort((x, y) => y.links - x.links).slice(0, s.max ?? 3000);
  writeFileSync(cache, JSON.stringify(items));
  return items;
}

const clean = (label: string, person: boolean): string | null => {
  let l = label.replace(/\s*\((?:[^()]*\b(film|movie|series|novel|band|album|song|TV series|video game|\d{4})\b[^()]*)\)\s*$/i, "").trim();
  if (!l || l.length > 70 || /^(list of|category:|template:|wikipedia:|portal:)/i.test(l)) return null;
  if (/^Q\d+$/.test(l)) return null;
  if (person && /,/.test(l)) return null;
  if (!/[a-z]/i.test(l)) return null;
  return /^[a-z]/.test(l) ? l[0].toUpperCase() + l.slice(1) : l;
};
const cleanAlias = (a: string) => {
  const t = a.trim();
  if (t.length < 3 || t.length > 60 || !/[a-z]/i.test(t) || /^Q\d+$/.test(t)) return null;
  if (/[^\x20-\x7EÀ-ɏ]/.test(t)) return null; // keep Latin-script spellings only
  return t;
};

function median(a: number[]) { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }

async function main() {
  const only = process.argv.slice(2);
  const out: Record<string, Record<string, [string, number, string[]?][]>> = {};
  let totalNew = 0;
  for (const s of SPECS.filter((x) => !only.length || only.includes(x.id))) {
    const p = promptById(s.id);
    if (!p) { console.log(`? ${s.id}: no such prompt`); continue; }
    let items: Item[];
    try { items = await fetchSpec(s); } catch (e) { console.log(`✗ ${s.id}: ${(e as Error).message.slice(0, 120)}`); continue; }

    // Curated answers: their keys and the popularity of the ones Wikidata knows, per tier.
    const curatedKey = new Map<string, TierKey>();
    for (const t of TIER_KEYS) for (const a of p.tiers[t]) for (const f of [a.name, ...a.aliases]) curatedKey.set(normalize(f), t);
    const tierLinks: Record<string, number[]> = {};
    for (const it of items) {
      const t = [it.label, ...it.alts].map((x) => curatedKey.get(normalize(x))).find(Boolean);
      if (t) (tierLinks[t] ??= []).push(it.links);
    }
    const all = items.map((i) => i.links).sort((a, b) => b - a);
    const pct = (q: number) => all[Math.min(all.length - 1, Math.floor(all.length * q))] ?? 0;
    // Thresholds: curated medians where available, otherwise popularity percentiles of this list.
    const th = {
      ground: Math.max(median(tierLinks.ground ?? []) || pct(0.02), pct(0.02)),
      orbit: median(tierLinks.orbit ?? []) || pct(0.15),
      moonshot: median(tierLinks.moonshot ?? []) || pct(0.45),
    };
    const tierFor = (links: number): TierKey => (links >= th.ground ? "ground" : links >= th.orbit ? "orbit" : links >= th.moonshot ? "moonshot" : "deep");

    // New answers, de-duplicated, with aliases that don't collide with any other answer.
    const fresh: { name: string; tier: TierKey; alts: string[]; key: string }[] = [];
    const seen = new Set(curatedKey.keys());
    for (const it of items) {
      const name = clean(it.label, !!s.person);
      if (!name) continue;
      const key = normalize(name);
      if (key.length < 2 || seen.has(key) || it.alts.some((a) => curatedKey.has(normalize(a)))) { seen.add(key); continue; }
      seen.add(key);
      fresh.push({ name, tier: tierFor(it.links), alts: it.alts.map(cleanAlias).filter((a): a is string => !!a), key });
    }
    const aliasCount = new Map<string, number>();
    for (const f of fresh) for (const a of new Set(f.alts.map(normalize))) aliasCount.set(a, (aliasCount.get(a) ?? 0) + 1);
    const rows: [string, number, string[]?][] = fresh.map((f) => {
      const alts = [...new Map(f.alts.map((a) => [normalize(a), a])).entries()]
        .filter(([k]) => k !== f.key && k.length >= 3 && !seen.has(k) && (aliasCount.get(k) ?? 0) === 1 && !curatedKey.has(k))
        .map(([, a]) => a).slice(0, 6);
      return alts.length ? [f.name, TIER_KEYS.indexOf(f.tier), alts] : [f.name, TIER_KEYS.indexOf(f.tier)];
    });
    (out[p.topic] ??= {})[p.id] = rows;
    totalNew += rows.length;
    const byTier = TIER_KEYS.map((t, i) => `${t[0]}${rows.filter((r) => r[1] === i).length}`).join(" ");
    console.log(`✓ ${s.id.padEnd(26)} ${String(items.length).padStart(5)} found → +${String(rows.length).padEnd(5)} new (${byTier})`);
    await new Promise((r) => setTimeout(r, 300));
  }
  mkdirSync("src/content/generated", { recursive: true });
  for (const [topic, prompts] of Object.entries(out)) {
    const file = `src/content/generated/${topic}.json`;
    const prev = existsSync(file) && only.length ? JSON.parse(readFileSync(file, "utf8")) : {};
    writeFileSync(file, JSON.stringify({ ...prev, ...prompts }));
  }
  console.log(`\n${totalNew} new accepted answers across ${Object.values(out).reduce((n, o) => n + Object.keys(o).length, 0)} prompts (of ${ALL_PROMPTS.length}).`);
}
main();
