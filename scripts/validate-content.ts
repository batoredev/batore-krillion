// Checks every prompt: exactly one gem, no empty tiers, no answer listed twice,
// and warns where two different answers are close enough for typo-matching to confuse them.
import { ALL_PROMPTS } from "../src/content";
import { TOPICS } from "../src/content/types";
import { TIER_KEYS } from "../src/game/tiers";
import { distance, normalize, typoAllowance, answerCount } from "../src/game/match";

let errors = 0, warnings = 0;
const err = (m: string) => { errors++; console.log("  ERROR  " + m); };
const warn = (m: string) => { warnings++; if (process.argv.includes("--warnings")) console.log("  warn   " + m); };

const ids = new Set<string>();
for (const pr of ALL_PROMPTS) {
  const tag = `[${pr.id}]`;
  if (ids.has(pr.id)) err(`${tag} duplicate prompt id`);
  ids.add(pr.id);
  if (pr.tiers.gem.length !== 1) err(`${tag} must have exactly one gem (has ${pr.tiers.gem.length})`);
  for (const t of TIER_KEYS) if ((t === "ground" || t === "orbit") && pr.tiers[t].length === 0) err(`${tag} tier "${t}" is empty`);
  const seen = new Map<string, string>();
  const keys: { key: string; name: string }[] = [];
  for (const t of TIER_KEYS) for (const a of pr.tiers[t]) for (const form of [a.name, ...a.aliases]) {
    const k = normalize(form);
    const owner = `${a.name} (${t})`;
    if (seen.has(k) && seen.get(k) !== owner) err(`${tag} "${form}" appears as both ${seen.get(k)} and ${owner}`);
    seen.set(k, owner);
    keys.push({ key: k, name: owner });
  }
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const a = keys[i], b = keys[j];
    if (a.name === b.name) continue;
    const allow = typoAllowance(Math.min(a.key.length, b.key.length));
    if (allow && distance(a.key, b.key, allow) <= allow) warn(`${tag} "${a.key}" ~ "${b.key}" (${a.name} vs ${b.name})`);
  }
}
console.log("\nPrompts per topic:");
for (const t of TOPICS) {
  const ps = ALL_PROMPTS.filter((p) => p.topic === t.id);
  console.log(`  ${t.name.padEnd(28)} ${String(ps.length).padStart(3)} prompts, ${ps.reduce((n, p) => n + answerCount(p), 0)} answers`);
}
console.log(`\n${ALL_PROMPTS.length} prompts · ${errors} errors · ${warnings} typo-overlap warnings${process.argv.includes("--warnings") ? "" : " (run with --warnings to list)"}`);
process.exit(errors ? 1 : 0);
