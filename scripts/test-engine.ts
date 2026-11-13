// Quick checks for the game engine: matching, tiers, set selection and dates.
import assert from "node:assert/strict";
import { matchAnswer, normalize } from "../src/game/match";
import { promptById } from "../src/content";
import { dailySet, endlessSet, packSet, setFromKey } from "../src/game/sets";
import { dateForDaily, todayDailyNumber, LAUNCH_DATE } from "../src/game/time";
import { MAX_SCORE, bandFor } from "../src/game/tiers";

let passed = 0;
const test = (name: string, fn: () => void) => { fn(); passed++; console.log("  ✓ " + name); };

const sweets = promptById("ic-sweet")!;
const states = promptById("ig-state")!;
const capitals = promptById("ig-capital")!;

test("normalize strips case, accents, punctuation and leading articles", () => {
  assert.equal(normalize("  The Rasgulla! "), "rasgulla");
  assert.equal(normalize("Crème Brûlée"), "cremebrulee");
  assert.equal(normalize("Larsen & Toubro"), "larsenandtoubro");
});
test("exact match finds the right tier", () => {
  assert.equal(matchAnswer(sweets, "gulab jamun")?.tier, "ground");
  assert.equal(matchAnswer(sweets, "Ledikeni")?.tier, "gem");
  assert.equal(matchAnswer(sweets, "Ledikeni")?.points, 100);
});
test("aliases count", () => {
  assert.equal(matchAnswer(capitals, "Bangalore")?.answer, "Bengaluru");
  assert.equal(matchAnswer(states, "orissa")?.answer, "Odisha");
});
test("small typos are forgiven, short words must be exact", () => {
  assert.equal(matchAnswer(states, "Maharastra")?.answer, "Maharashtra");
  assert.equal(matchAnswer(states, "Gao"), null); // 3 letters: no typo allowance
});
test("wrong answers don't match", () => {
  assert.equal(matchAnswer(states, "Paris"), null);
  assert.equal(matchAnswer(states, ""), null);
});
test("daily sets are deterministic with 7 different topics", () => {
  const a = dailySet(5), b = dailySet(5);
  assert.deepEqual(a.prompts.map((p) => p.id), b.prompts.map((p) => p.id));
  assert.equal(new Set(a.prompts.map((p) => p.topic)).size, 7);
  assert.notDeepEqual(dailySet(6).prompts.map((p) => p.id), a.prompts.map((p) => p.id));
});
test("endless and pack sets resolve from keys", () => {
  assert.deepEqual(setFromKey("endless:42")?.prompts.map((p) => p.id), endlessSet(42).prompts.map((p) => p.id));
  const pack = packSet("indian-movies", 3);
  assert.equal(pack.prompts.length, 7);
  assert.ok(pack.prompts.every((p) => p.topic === "indian-movies"));
  assert.equal(setFromKey("pack:indian-movies:11"), null);
  assert.equal(setFromKey("pack:nope:1"), null);
});
test("future dailies are refused", () => {
  assert.equal(setFromKey(`daily:${todayDailyNumber() + 1}`), null);
  assert.ok(setFromKey(`daily:${todayDailyNumber()}`));
});
test("daily #1 is the launch date", () => {
  assert.equal(dateForDaily(1), LAUNCH_DATE);
  assert.equal(todayDailyNumber(Date.parse(LAUNCH_DATE + "T00:30:00+05:30")), 1);
  assert.equal(todayDailyNumber(Date.parse(LAUNCH_DATE + "T23:59:00+05:30")), 1);
  assert.equal(todayDailyNumber(Date.parse("2026-11-14T00:00:30+05:30")), 2);
});
test("bands cover every score", () => {
  assert.equal(MAX_SCORE, 700);
  assert.equal(bandFor(0).title, "Launchpad");
  assert.equal(bandFor(251).title, "Lunar");
  assert.equal(bandFor(700).title, "Kribatov");
});
console.log(`\n${passed} tests passed`);
