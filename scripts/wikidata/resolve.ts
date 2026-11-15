// Resolves English labels to Wikidata IDs (most-linked item with exactly that label) and prints them for review.
import { writeFileSync, existsSync, readFileSync } from "fs";
import { sparql } from "./wdqs";
import { SPECS } from "./specs";
export const PLACEHOLDER = /\{([^{}\s?][^{}]*)\}/g;

const labels = new Set<string>();
for (const s of SPECS) for (const m of s.q.matchAll(PLACEHOLDER)) labels.add(m[1]);
const out: Record<string, { id: string; desc: string; links: number }> = existsSync("scripts/wikidata/ids.json") ? JSON.parse(readFileSync("scripts/wikidata/ids.json", "utf8")) : {};
const todo = [...labels].filter((l) => !out[l]);
(async () => {
  for (let i = 0; i < todo.length; i += 25) {
    const batch = todo.slice(i, i + 25);
    const values = [...new Set(batch.map((l) => l.split("~")[0]))].map((l) => `"${l.replace(/"/g, '\\"')}"@en`).join(" ");
    const rows = await sparql(`SELECT ?l ?item ?desc ?links WHERE { VALUES ?l { ${values} } ?item rdfs:label ?l; wikibase:sitelinks ?links. OPTIONAL { ?item schema:description ?desc FILTER(LANG(?desc)="en") } }`);
    for (const l of batch) {
      const [label, hint] = l.split("~");
      const cands = rows.filter((r) => r.l.value === label && (!hint || (r.desc?.value ?? "").toLowerCase().includes(hint.toLowerCase())))
        .sort((a, b) => Number(b.links.value) - Number(a.links.value));
      if (!cands.length) { console.log(`✗ ${l}: not found`); continue; }
      const c = cands[0];
      out[l] = { id: c.item.value.split("/").pop()!, desc: c.desc?.value ?? "", links: Number(c.links.value) };
    }
  }
  writeFileSync("scripts/wikidata/ids.json", JSON.stringify(out, null, 1));
  for (const l of [...labels].sort()) if (out[l]) console.log(`${l.padEnd(42)} ${out[l].id.padEnd(11)} ${String(out[l].links).padStart(4)}  ${out[l].desc.slice(0, 60)}`);
})();
