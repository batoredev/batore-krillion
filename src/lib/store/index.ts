import path from "path";
import { JsonStore } from "./json-store";
import type { Store } from "./types";

export type * from "./types";

// One store per server process (kept on globalThis so dev hot-reload doesn't create duplicates).
const g = globalThis as unknown as { __kribatovStore?: Store };

export function getStore(): Store {
  if (!g.__kribatovStore) {
    const dir = process.env.KRIBATOV_DATA_DIR || path.join(process.cwd(), "data");
    g.__kribatovStore = new JsonStore(path.join(dir, "db.json"));
  }
  return g.__kribatovStore;
}
