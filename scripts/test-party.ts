// Rules tests for party mode (Hot Comet). Time and randomness are injected, so these are exact.
import assert from "node:assert/strict";
import * as E from "../src/party/engine";
import { promptById } from "../src/content";

let passed = 0;
const test = (name: string, fn: () => void) => { fn(); passed++; console.log("  ✓ " + name); };
const rng = (seq: number[]) => { let i = 0; return () => seq[i++ % seq.length]; };
const A = { userId: "a", name: "Asha" }, B = { userId: "b", name: "Bilal" }, C = { userId: "c", name: "Chen" };

function setup(lives = 2, players = [A, B, C]) {
  const room = E.createRoom("TEST", players[0], 0, { lives, topic: "indian-geography" });
  for (const p of players.slice(1)) E.join(room, p, 0);
  assert.equal(E.start(room, "a", 1000, rng([0])), null); // rng 0 → first prompt in pool, holder = a, fuse = min (10s)
  return room;
}
const validAnswers = (room: E.Room) => {
  const p = promptById(room.promptId!)!;
  return [...p.tiers.ground, ...p.tiers.orbit, ...p.tiers.moonshot].map((x) => x.name);
};

test("only the host can start, and it needs 2 connected players", () => {
  const room = E.createRoom("X", A, 0);
  assert.match(E.start(room, "a", 0, rng([0]))!, /at least 2/);
  E.join(room, B, 0);
  assert.match(E.start(room, "b", 0, rng([0]))!, /host/);
  assert.equal(E.start(room, "a", 0, rng([0])), null);
  assert.equal(room.status, "playing");
});
test("fuse is hidden from the public view", () => {
  const room = setup();
  const view = E.publicView(room, 1000) as Record<string, unknown>;
  assert.ok(!("fuseEndsAt" in view));
  assert.ok(!JSON.stringify(view).includes(String(room.fuseEndsAt)));
});
test("a valid answer passes the comet to the next player; the fuse keeps burning", () => {
  const room = setup();
  assert.equal(room.holderId, "a");
  const fuse = room.fuseEndsAt!;
  const r = E.submitAnswer(room, "a", validAnswers(room)[0], 2000);
  assert.ok(r.ok);
  assert.equal(room.holderId, "b");
  assert.equal(room.fuseEndsAt, fuse); // 9s left > 8s minimum: unchanged
});
test("with less than 8s left, the fuse is topped up to 8s on pass", () => {
  const room = setup();
  const t = room.fuseEndsAt! - 3000;
  const r = E.submitAnswer(room, "a", validAnswers(room)[0], t);
  assert.ok(r.ok);
  assert.equal(room.fuseEndsAt, t + 8000);
  assert.equal(room.holderId, "b");
});
test("wrong, repeated and out-of-turn answers are rejected", () => {
  const room = setup();
  const [first] = validAnswers(room);
  assert.deepEqual(E.submitAnswer(room, "b", first, 1500), { ok: false, reason: "not-your-turn" });
  assert.deepEqual(E.submitAnswer(room, "a", "zzqqxx", 1500), { ok: false, reason: "invalid" });
  assert.ok(E.submitAnswer(room, "a", first, 1600).ok);
  const again = E.submitAnswer(room, "b", first.toUpperCase(), 1700);
  assert.equal(again.ok, false);
  assert.equal((again as { reason: string }).reason, "used");
});
test("when the fuse runs out the holder loses a life, a new prompt starts after a pause", () => {
  const room = setup();
  const oldPrompt = room.promptId;
  assert.equal(E.tick(room, room.fuseEndsAt! - 1, rng([0.5])), false);
  assert.equal(E.tick(room, room.fuseEndsAt!, rng([0.5])), true);
  assert.equal(room.players.find((p) => p.userId === "a")!.lives, 1);
  assert.notEqual(room.promptId, oldPrompt);
  assert.equal(room.holderId, "b");
  assert.ok(room.pausedUntil);
  assert.equal(E.submitAnswer(room, "b", validAnswers(room)[0], room.pausedUntil! - 1).ok, false); // paused
  assert.equal(E.tick(room, room.pausedUntil!, rng([0.5])), true);
  assert.equal(room.pausedUntil, null);
  assert.ok(room.fuseEndsAt !== null);
});
test("running out of lives knocks you out; last one standing wins", () => {
  const room = setup(1, [A, B]);
  E.tick(room, room.fuseEndsAt!, rng([0])); // a pops with 1 life → out
  assert.equal(room.status, "finished");
  assert.equal(room.winnerId, "b");
  assert.equal(room.players.find((p) => p.userId === "a")!.placedAt, 2);
  assert.equal(room.players.find((p) => p.userId === "b")!.placedAt, 1);
});
test("eliminated players are skipped in turn order", () => {
  const room = setup(1);
  E.tick(room, room.fuseEndsAt!, rng([0])); // a out
  E.tick(room, room.pausedUntil!, rng([0]));
  assert.equal(room.holderId, "b");
  assert.ok(E.submitAnswer(room, "b", validAnswers(room)[0], room.pausedUntil! + 1).ok);
  assert.equal(room.holderId, "c");
  assert.ok(E.submitAnswer(room, "c", validAnswers(room)[1], room.pausedUntil! + 2).ok);
  assert.equal(room.holderId, "b"); // skips a
});
test("leaving mid-game counts as out and hands the comet on; host passes to someone else", () => {
  const room = setup();
  E.leave(room, "a", 1500, rng([0]));
  assert.equal(room.hostId, "b");
  assert.equal(room.holderId, "b");
  assert.equal(room.players.find((p) => p.userId === "a")!.alive, false);
});
test("joining a running game makes you a spectator; play again promotes them", () => {
  const room = setup(1, [A, B]);
  assert.equal(E.join(room, C, 1200), "spectator");
  E.tick(room, room.fuseEndsAt!, rng([0]));
  assert.equal(room.status, "finished");
  assert.equal(E.resetToLobby(room, "b", 50_000), "Only the host can do that.");
  assert.equal(E.resetToLobby(room, "a", 50_000), null);
  assert.deepEqual(room.players.map((p) => p.userId), ["a", "b", "c"]);
  assert.ok(room.players.every((p) => p.alive && p.lives === 1));
});
test("settings are clamped to safe ranges", () => {
  const room = E.createRoom("S", A, 0);
  E.updateSettings(room, "a", { lives: 99, maxPlayers: 50, fuseMinMs: 1, fuseMaxMs: 0 });
  assert.equal(room.settings.lives, 5);
  assert.equal(room.settings.maxPlayers, 10);
  assert.ok(room.settings.fuseMinMs >= 5000 && room.settings.fuseMaxMs >= room.settings.fuseMinMs);
  assert.equal(E.updateSettings(room, "b", { lives: 1 }), "Only the host can change settings.");
});
test("party prompt pool only uses prompts with plenty of answers", () => {
  assert.ok(E.promptPool("all").length >= 70);
  assert.ok(E.promptPool("all").every((p) => p.id !== "ca-brics"));
});
console.log(`\n${passed} party tests passed`);
