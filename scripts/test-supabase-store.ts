// End-to-end check of SupabaseStore against a real project: creates throwaway rows
// (username "zz_test_<random>"), reads them back, then deletes them.
// Usage: npm run test-supabase
import "./env";
import assert from "node:assert/strict";
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { SupabaseStore } from "../src/lib/store/supabase-store";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_KEY_VIA_PROXY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first."); process.exit(1); }

// When a proxy injects the real key into the apikey header, don't send a placeholder Authorization header.
const viaProxy: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  headers.delete("authorization");
  return fetch(input, { ...init, headers });
};
const fetchImpl = SUPABASE_KEY_VIA_PROXY ? viaProxy : undefined;

async function main() {
  const db = new SupabaseStore(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, fetchImpl);
  const raw = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }, ...(fetchImpl ? { global: { fetch: fetchImpl } } : {}) });
  const tag = randomBytes(3).toString("hex");
  const a = { id: `zzt${tag}a`, username: `zz_test_${tag}a` }, b = { id: `zzt${tag}b`, username: `zz_test_${tag}b` };
  const now = new Date().toISOString();
  try {
    for (const u of [a, b]) await db.createUser({ ...u, displayName: "Test " + u.username, passwordHash: "scrypt$00$00", role: "player", disabled: false, createdAt: now, lastLoginAt: null });
    await assert.rejects(db.createUser({ ...a, id: a.id + "x", displayName: "dup", passwordHash: "x", role: "player", disabled: false, createdAt: now, lastLoginAt: null }), /USERNAME_TAKEN/);
    assert.equal((await db.getUserByUsername(a.username.toUpperCase()))?.id, a.id);
    await db.updateUser(a.id, { displayName: "Renamed", lastLoginAt: now });
    const ua = await db.getUserById(a.id);
    assert.equal(ua?.displayName, "Renamed");
    assert.equal(ua?.lastLoginAt, now);

    await db.createSession({ tokenHash: `zzt${tag}`, userId: a.id, createdAt: now, expiresAt: new Date(Date.now() + 86400e3).toISOString() });
    assert.equal((await db.getSession(`zzt${tag}`))?.userId, a.id);

    await db.addResult({ id: `zzt${tag}r`, userId: a.id, setKey: `zz-test:${tag}`, mode: "daily", dailyNumber: 1, playedOnDate: "2026-11-13",
      rounds: [{ promptId: "p", guess: "x", answer: "X", tier: "gem", points: 100 }], score: 100, firstAttempt: true, countsForStreak: true, createdAt: now });
    const rs = await db.listResultsForSet(`zz-test:${tag}`);
    assert.equal(rs.length, 1);
    assert.equal(rs[0].rounds[0].tier, "gem");
    assert.equal(rs[0].playedOnDate, "2026-11-13");
    assert.equal((await db.listResultsForUser(a.id)).length, 1);

    await db.addFriendship(a.id, b.id);
    await db.addFriendship(a.id, b.id); // idempotent
    assert.deepEqual(await db.listFriendIds(a.id), [b.id]);
    assert.deepEqual(await db.listFriendIds(b.id), [a.id]);
    await db.removeFriendship(b.id, a.id);
    assert.deepEqual(await db.listFriendIds(a.id), []);

    await db.deleteSessionsForUser(a.id);
    assert.equal(await db.getSession(`zzt${tag}`), null);
    console.log("✓ SupabaseStore works end to end against", SUPABASE_URL);
  } finally {
    await raw.from("users").delete().in("id", [a.id, b.id]); // cascades to sessions, results, friendships
  }
}
main().catch((e) => { console.error("✗", e.message ?? e); process.exit(1); });
