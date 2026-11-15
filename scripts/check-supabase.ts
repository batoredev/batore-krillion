// Checks the Supabase connection and that every table from supabase/schema.sql exists.
// Usage: npm run check-supabase
import "./env";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first."); process.exit(1); }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  let ok = true;
  for (const t of ["users", "sessions", "results", "friendships"]) {
    const { count, error } = await db.from(t).select("*", { count: "exact", head: true });
    if (error) { ok = false; console.log(`  ✗ ${t}: ${error.message}`); } else console.log(`  ✓ ${t} (${count ?? 0} rows)`);
  }
  console.log(ok ? "\nSupabase is ready." : "\nSomething is missing: run supabase/schema.sql in the SQL Editor, and check the key is the service-role/secret key.");
  process.exit(ok ? 0 : 1);
}
main();
