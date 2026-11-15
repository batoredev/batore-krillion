// Quick checks for the game engine: matching, tiers, set selection and dates.
import assert from "node:assert/strict";
import { matchAnswer, normalize } from "../src/game/match";
import { promptById, promptsByTopic } from "../src/content";
import { TOPICS } from "../src/content/types";
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
test("small typos are forgiven, very short words must be exact", () => {
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
test("adding content never changes past dailies", () => {
  for (let n = 1; n <= 30; n++) for (const p of dailySet(n).prompts) assert.ok(p.since <= n, `daily ${n} used ${p.id} (since ${p.since})`);
  // Daily #1 was played before batch 2 existed: it must only use the original 88 prompts.
  assert.ok(dailySet(1).prompts.every((p) => p.since === 1));
});
test("every topic has at least 30 prompts", () => {
  for (const t of TOPICS) assert.ok(promptsByTopic(t.id).length >= 30, t.name);
});
{
const should: [string, string, string][] = [
  ["ic-sweet","rasagulla","Rasgulla"],["ic-sweet","gulabjamun","Gulab jamun"],["ic-sweet","jalebis","Jalebi"],["ic-sweet","kaju katlee","Kaju katli"],["ic-sweet","rasmalai","Rasmalai"],["ic-sweet","ladu","Ladoo"],
  ["ic-curry","panir butter masala","Paneer butter masala"],["ic-curry","palak panir","Palak paneer"],["ic-curry","channa masala","Chole"],["ic-curry","rajmah","Rajma"],
  ["ic-street","golgappe","Pani puri"],["ic-street","vadapav","Vada pav"],["ic-street","samosas","Samosa"],["ic-street","pavbhaji","Pav bhaji"],["ic-street","bhelpuri","Bhel puri"],["ic-street","momo","Momos"],
  ["ig-state","maharastra","Maharashtra"],["ig-state","tamilnadu","Tamil Nadu"],["ig-state","chattisgarh","Chhattisgarh"],["ig-state","orrisa","Odisha"],["ig-state","arunachal","Arunachal Pradesh"],["ig-state","telengana","Telangana"],
  ["ig-capital","bangalore","Bengaluru"],["ig-capital","thiruvananthapuram","Thiruvananthapuram"],["ig-capital","trivandram","Thiruvananthapuram"],["ig-capital","bhubaneshwar","Bhubaneswar"],
  ["it-cricketer","kohli","Virat Kohli"],["it-cricketer","dhoni","MS Dhoni"],["it-cricketer","sachin","Sachin Tendulkar"],["it-cricketer","tendulkar","Sachin Tendulkar"],["it-cricketer","bumra","Jasprit Bumrah"],["it-cricketer","virat kholi","Virat Kohli"],["it-cricketer","rahul dravid","Rahul Dravid"],
  ["im-aamir","three idiots","3 Idiots"],["im-aamir","3 idiot","3 Idiots"],["im-aamir","lagan","Lagaan"],["im-aamir","taare zamin par","Taare Zameen Par"],["im-srk","kuch kuch hota hai","Kuch Kuch Hota Hai"],["im-srk","dilwale dulhania le jayenge","Dilwale Dulhania Le Jayenge"],["im-srk","pathan","Pathaan"],
  ["hist-british-monarch","henry 8","Henry VIII"],["hist-british-monarch","elizabeth the second","Queen Elizabeth II"],["geo-8000","everest","Mount Everest"],["geo-8000","kanchenjunga","Kangchenjunga"],
  ["it-deity","shiv","Shiva"],["it-deity","ganpati","Ganesha"],["it-deity","laxmi","Lakshmi"],["it-deity","hanumanji","Hanuman"],["it-deity","krishn","Krishna"],
  ["gt-dog","labrador retriever","Labrador"],["gt-dog","german shepard","German Shepherd"],["gt-dog","golden retriver","Golden Retriever"],["gt-dog","chihuahua","Chihuahua"],["gt-dog","dachshunds","Dachshund"],
  ["gm-nolan","the dark night","The Dark Knight"],["gm-nolan","intersteller","Interstellar"],["gm-mcu","endgame","Avengers: Endgame"],["gm-mcu","avengers endgame","Avengers: Endgame"],
  ["auto-brand","mercedes","Mercedes-Benz"],["auto-brand","volkswagon","Volkswagen"],["auto-brand","lamborgini","Lamborghini"],["auto-brand","porshe","Porsche"],
  ["ig-national-park","corbett","Jim Corbett"],["ig-national-park","kaziranga national park","Kaziranga"],["ihp-pm","nehru","Jawaharlal Nehru"],["ihp-pm","modi","Narendra Modi"],["ihp-pm","vajpayee","Atal Bihari Vajpayee"],
  ["gc-pasta","spagetti","Spaghetti"],["gc-pasta","fettucini","Fettuccine"],["gc-cheese","parmesan cheese","Parmesan"],["gc-japanese","ramen noodles","Ramen"],
];
const shouldNot: [string, string][] = [
  ["ig-state","paris"],["ig-state","india"],["ig-state","delhi"],["ig-capital","goa"],["ic-sweet","biryani"],["ic-sweet","samosa"],["ic-street","ice cream sundae"],
  ["it-cricketer","messi"],["it-cricketer","singh"],["it-cricketer","sharma"],["it-cricketer","kumar"],["im-srk","sholay"],["im-aamir","dangal 2"],["gt-dog","cat"],["gt-dog","lion"],
  ["auto-brand","nike"],["gc-pasta","rice"],["gm-nolan","titanic"],["ihp-pm","gandhi"],["it-deity","jesus"],["geo-8000","kilimanjaro"],["hist-british-monarch","henry 9"],
];
  test(`forgiving matching accepts ${should.length} real-world spellings`, () => {
    for (const [pid, g, want] of should) assert.equal(matchAnswer(promptById(pid)!, g)?.answer, want, `"${g}" should be ${want}`);
  });
  test(`matching rejects ${shouldNot.length} wrong answers`, () => {
    for (const [pid, g] of shouldNot) assert.equal(matchAnswer(promptById(pid)!, g), null, `"${g}" should be rejected for ${pid}`);
  });
}
console.log(`\n${passed} tests passed`);
