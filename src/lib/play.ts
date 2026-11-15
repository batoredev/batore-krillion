import "server-only";
// Server-side answer checking for solo play (daily, endless, packs).
// The browser never receives answer lists before finishing a set:
//  1. startRound   → a signed, timed token for (player, set, round)
//  2. checkGuess   → valid? tier + points + a signed proof; otherwise just "no"
//  3. submitResult → only guesses with a valid proof score points
import { randomBytes } from "crypto";
import type { User } from "./store";
import { setFromKey } from "@/game/sets";
import { matchAnswer } from "@/game/match";
import { SECONDS_PER_PROMPT, TIER_KEYS, type TierKey } from "@/game/tiers";
import { signData, ticketSecret, verifyData } from "@/party/ticket";
import { ensureAdditions, recordMiss } from "./answers";

/** Countdown (3 × 0.7s) + the 25-second clock + network allowance. */
export const ROUND_WINDOW_MS = 2_100 + SECONDS_PER_PROMPT * 1000 + 4_000;
const PROOF_TTL_MS = 6 * 3600_000;

const g = globalThis as unknown as { __kribatovPlaySecret?: string };
function secret(): string {
  const s = ticketSecret(process.env);
  if (s) return s;
  // Single-server fallback (local / JSON store): a per-process secret is enough there.
  if (!g.__kribatovPlaySecret) g.__kribatovPlaySecret = randomBytes(32).toString("hex");
  return g.__kribatovPlaySecret;
}

interface RoundToken { k: "round"; u: string; s: string; r: number; t: number }
interface Proof { k: "proof"; u: string; s: string; r: number; g: string; at: number }

export async function startRound(user: User, setKey: string, round: number) {
  const set = setFromKey(setKey);
  if (!set) throw new Error("Unknown set");
  if (!Number.isInteger(round) || round < 0 || round >= set.prompts.length) throw new Error("Bad round");
  const token = await signData<RoundToken>({ k: "round", u: user.id, s: setKey, r: round, t: Date.now() }, secret(), ROUND_WINDOW_MS);
  return { token, windowMs: ROUND_WINDOW_MS };
}

export type CheckResponse =
  | { ok: false; reason: "not-on-list" | "time-up" | "bad-token" }
  | { ok: true; tier: TierKey; answer: string; points: number; exact: boolean; proof: string };

export async function checkGuess(user: User, token: string, guess: string): Promise<CheckResponse> {
  const t = await verifyData<RoundToken>(token, secret());
  if (!t || t.k !== "round" || t.u !== user.id) {
    // An expired token is the common case (the clock ran out); anything else is tampering.
    return { ok: false, reason: t === null ? "time-up" : "bad-token" };
  }
  const set = setFromKey(t.s);
  const prompt = set?.prompts[t.r];
  if (!prompt) return { ok: false, reason: "bad-token" };
  const g = String(guess ?? "").slice(0, 80);
  await ensureAdditions();
  const m = matchAnswer(prompt, g);
  if (!m) {
    await recordMiss(user, prompt.id, g);
    return { ok: false, reason: "not-on-list" };
  }
  const proof = await signData<Proof>({ k: "proof", u: user.id, s: t.s, r: t.r, g, at: Date.now() }, secret(), PROOF_TTL_MS);
  return { ok: true, tier: m.tier, answer: m.answer, points: m.points, exact: m.exact, proof };
}

/** The guess behind a proof, if the proof is genuine and belongs to this player, set and round. */
export async function guessFromProof(proof: string | null | undefined, user: User, setKey: string, round: number): Promise<string | null> {
  if (!proof) return null;
  const p = await verifyData<Proof>(proof, secret());
  if (!p || p.k !== "proof" || p.u !== user.id || p.s !== setKey || p.r !== round) return null;
  return p.g;
}

/** Answer lists for the results screen, sent only after a set is finished. */
export async function revealSet(setKey: string) {
  await ensureAdditions();
  const set = setFromKey(setKey);
  if (!set) return [];
  return set.prompts.map((p) => ({
    id: p.id,
    tiers: Object.fromEntries(TIER_KEYS.map((t) => [t, p.tiers[t].map((a) => a.name)])) as Record<TierKey, string[]>,
  }));
}
export type Reveal = Awaited<ReturnType<typeof revealSet>>;
