import "server-only";
// Keeps admin-added answers loaded (refreshed every 30 seconds) and records rejected guesses.
import { applyAdditions } from "@/content/additions";
import { normalize } from "@/game/match";
import { newId } from "./passwords";
import { getStore, type User } from "./store";

const g = globalThis as unknown as { __kribatovAdditions?: { at: number; loading: Promise<void> | null } };
const REFRESH_MS = 30_000;

/** Make sure the latest admin-added answers are applied before checking a guess. */
export async function ensureAdditions(force = false) {
  const st = (g.__kribatovAdditions ??= { at: 0, loading: null });
  if (!force && Date.now() - st.at < REFRESH_MS) return;
  if (!st.loading) {
    st.loading = (async () => {
      try { applyAdditions(await getStore().listAnswerAdditions()); st.at = Date.now(); }
      catch (e) { console.error("Could not load answer additions:", e); st.at = Date.now() - REFRESH_MS + 5_000; }
      finally { st.loading = null; }
    })();
  }
  await st.loading;
}

/** Log a rejected guess for admin review. Never throws: logging must not break the game. */
export async function recordMiss(user: User, promptId: string, guess: string) {
  const g2 = guess.trim().slice(0, 60);
  const key = normalize(g2);
  if (key.length < 2) return;
  try {
    await getStore().addMissedGuess({ id: newId(), promptId, guess: g2, key, userId: user.id, createdAt: new Date().toISOString() });
  } catch (e) { console.error("Could not record missed guess:", e); }
}
