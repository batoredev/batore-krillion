// Minimal Wikidata Query Service client for the content build (not used by the app at runtime).
const UA = "KribatovContentBuilder/1.0 (trivia game dataset build)";
export async function sparql<T = Record<string, { value: string }>>(query: string, tries = 4): Promise<T[]> {
  for (let i = 0; i < tries; i++) {
    const res = await fetch("https://query.wikidata.org/sparql", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/sparql-results+json", "user-agent": UA },
      body: new URLSearchParams({ query }).toString(),
    });
    if (res.ok) return ((await res.json()) as { results: { bindings: T[] } }).results.bindings;
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 4000 * (i + 1))); continue; }
    throw new Error(`WDQS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  throw new Error("WDQS: too many retries");
}
