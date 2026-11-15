// Searches Wikidata for unresolved labels (via WDQS's MediaWiki API bridge) and prints the top candidates.
import { sparql } from "./wdqs";
const terms = process.argv.slice(2).join(" ").split("|").map((t) => t.trim()).filter(Boolean);
(async () => {
  for (const t of terms) {
    const q = `SELECT ?item ?label ?desc ?links WHERE {
      SERVICE wikibase:mwapi { bd:serviceParam wikibase:api "EntitySearch"; wikibase:endpoint "www.wikidata.org"; mwapi:search "${t.replace(/"/g, "")}"; mwapi:language "en". ?item wikibase:apiOutputItem mwapi:item. ?ord wikibase:apiOrdinal true. }
      ?item rdfs:label ?label FILTER(LANG(?label)="en") OPTIONAL { ?item schema:description ?desc FILTER(LANG(?desc)="en") } OPTIONAL { ?item wikibase:sitelinks ?links }
    } ORDER BY ?ord LIMIT 4`;
    const rows = await sparql(q).catch((e) => { console.log(`! ${t}: ${e.message}`); return []; });
    console.log(`\n${t}`);
    for (const r of rows) console.log(`   ${r.item.value.split("/").pop()!.padEnd(11)} ${String(r.links?.value ?? 0).padStart(4)}  ${r.label.value} — ${(r.desc?.value ?? "").slice(0, 70)}`);
  }
})();
