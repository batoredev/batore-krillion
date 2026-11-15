import path from "path";
import { JsonStore } from "./json-store";
import { SupabaseStore } from "./supabase-store";
import type { Store } from "./types";

export type * from "./types";

// One store per server process (kept on globalThis so dev hot-reload doesn't create duplicates).
const g = globalThis as unknown as { __kribatovStore?: Store };

/** "supabase" when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set, otherwise the local JSON file. */
export const storeKind = () => (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "json");

export function getStore(): Store {
  if (!g.__kribatovStore) {
    if (storeKind() === "supabase") {
      g.__kribatovStore = new SupabaseStore(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    } else if (process.env.KRIBATOV_MEMORY_STORE === "1") {
      // Throwaway in-memory data, for local tests only (lost on restart).
      g.__kribatovStore = new JsonStore(null);
    } else {
      if (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers") {
        throw new Error("On Cloudflare, set SUPABASE_URL and the SUPABASE_SERVICE_ROLE_KEY secret: there is no disk for the JSON store.");
      }
      const dir = process.env.KRIBATOV_DATA_DIR || path.join(process.cwd(), "data");
      g.__kribatovStore = new JsonStore(path.join(dir, "db.json"));
    }
  }
  return g.__kribatovStore;
}
