// Copies everything from the local JSON store (data/db.json) into Supabase.
// Usage: npm run migrate-to-supabase      (needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local)
import "./env";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { SupabaseStore } from "../src/lib/store/supabase-store";
import type { Friendship, Result, Session, User } from "../src/lib/store/types";

async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first."); process.exit(1); }
  const file = path.join(process.env.KRIBATOV_DATA_DIR || "data", "db.json");
  if (!existsSync(file)) { console.error(`Nothing to migrate: ${file} not found.`); process.exit(1); }
  const data = JSON.parse(readFileSync(file, "utf8")) as { users: User[]; sessions: Session[]; results: Result[]; friendships: Friendship[] };
  const db = new SupabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let users = 0, results = 0, friends = 0;
  for (const u of data.users ?? []) {
    if (await db.getUserById(u.id)) continue;
    await db.createUser(u); users++;
  }
  for (const r of data.results ?? []) {
    try { await db.addResult(r); results++; } catch (e) { if ((e as { code?: string }).code !== "23505") throw e; }
  }
  for (const f of data.friendships ?? []) { await db.addFriendship(f.userId, f.friendId); friends++; }
  console.log(`Migrated ${users} users, ${results} results, ${friends} friendship rows. (Sessions are not copied: everyone logs in again.)`);
}
main();
