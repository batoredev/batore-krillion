import { body, fail, json, withUser } from "@/lib/http";
import { getStore, type AnswerAddition } from "@/lib/store";
import { newId } from "@/lib/passwords";
import { ensureAdditions } from "@/lib/answers";
import { promptById } from "@/content";
import { existingKeys } from "@/content/additions";
import { normalize } from "@/game/match";

export const dynamic = "force-dynamic";
const TIERS = ["ground", "decoy", "orbit", "moonshot", "deep"] as const;

// Missed guesses grouped by prompt + spelling, and the answers admins have added.
export async function GET() {
  return withUser(async () => {
    const store = getStore();
    await ensureAdditions(true);
    const missed = await store.listMissedGuesses(5000);
    const groups = new Map<string, { promptId: string; key: string; spellings: Map<string, number>; count: number; players: Set<string>; last: string }>();
    for (const m of missed) {
      const id = `${m.promptId}|${m.key}`;
      const g = groups.get(id) ?? { promptId: m.promptId, key: m.key, spellings: new Map(), count: 0, players: new Set(), last: m.createdAt };
      g.count++; g.players.add(m.userId);
      g.spellings.set(m.guess, (g.spellings.get(m.guess) ?? 0) + 1);
      if (m.createdAt > g.last) g.last = m.createdAt;
      groups.set(id, g);
    }
    const out = [...groups.values()]
      .map((g) => {
        const p = promptById(g.promptId);
        const spelling = [...g.spellings.entries()].sort((a, b) => b[1] - a[1])[0][0];
        return { promptId: g.promptId, prompt: p?.text ?? g.promptId, key: g.key, guess: spelling, count: g.count, players: g.players.size, last: g.last,
          alreadyAccepted: p ? existingKeys(p).has(g.key) : false };
      })
      .filter((g) => !g.alreadyAccepted)
      .sort((a, b) => b.players - a.players || b.count - a.count || b.last.localeCompare(a.last));
    const additions = (await store.listAnswerAdditions())
      .map((a) => ({ ...a, prompt: promptById(a.promptId)?.text ?? a.promptId }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return json({ missed: out.slice(0, 300), additions });
  }, { admin: true });
}

// Add an answer to a prompt (optionally clearing the matching missed guesses).
export async function POST(req: Request) {
  return withUser(async (admin) => {
    const b = await body<{ promptId?: string; answer?: string; tier?: string; aliases?: string[]; clearKey?: string }>(req);
    const p = b.promptId ? promptById(b.promptId) : null;
    if (!p) return fail("Unknown prompt");
    const answer = String(b.answer ?? "").trim().slice(0, 80);
    if (normalize(answer).length < 2) return fail("Enter an answer.");
    if (!TIERS.includes(b.tier as (typeof TIERS)[number])) return fail("Pick a tier.");
    await ensureAdditions(true);
    const keys = existingKeys(p);
    if (keys.has(normalize(answer))) return fail("That answer is already accepted for this prompt.");
    const aliases = (b.aliases ?? []).map((a) => String(a).trim().slice(0, 80)).filter((a) => normalize(a).length >= 2 && !keys.has(normalize(a)));
    const addition: AnswerAddition = { id: newId(), promptId: p.id, answer, aliases, tier: b.tier as AnswerAddition["tier"], addedBy: admin.id, createdAt: new Date().toISOString() };
    const store = getStore();
    await store.addAnswerAddition(addition);
    await store.deleteMissedGuesses(p.id, normalize(answer));
    if (b.clearKey) await store.deleteMissedGuesses(p.id, b.clearKey);
    for (const a of aliases) await store.deleteMissedGuesses(p.id, normalize(a));
    await ensureAdditions(true);
    return json({ ok: true, addition });
  }, { admin: true });
}

// Remove an added answer ({ id }) or dismiss a missed guess ({ promptId, key }).
export async function DELETE(req: Request) {
  return withUser(async () => {
    const b = await body<{ id?: string; promptId?: string; key?: string }>(req);
    const store = getStore();
    if (b.id) await store.deleteAnswerAddition(b.id);
    else if (b.promptId && b.key) await store.deleteMissedGuesses(b.promptId, b.key);
    else return fail("Nothing to delete");
    await ensureAdditions(true);
    return json({ ok: true });
  }, { admin: true });
}
