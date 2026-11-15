import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ALL_PROMPTS } from "@/content";
import { TOPICS } from "@/content/types";
import { AnswersPanel } from "./AnswersPanel";

export const dynamic = "force-dynamic";

export default async function AdminAnswers() {
  await requireAdmin();
  const prompts = ALL_PROMPTS.map((p) => ({ id: p.id, text: p.text, topic: TOPICS.find((t) => t.id === p.topic)?.name ?? p.topic }));
  return (
    <div className="page stack">
      <Link href="/admin" className="muted small">← Players</Link>
      <span className="eyebrow">Mission control</span>
      <h1 className="title">Missing answers</h1>
      <p className="muted">
        Every guess the game didn&apos;t accept lands here. If it&apos;s actually right, add it in the tier that fits:
        it&apos;s accepted straight away in solo games and Hot Comet, no redeploy needed. Dismiss guesses that are wrong.
      </p>
      <AnswersPanel prompts={prompts} />
    </div>
  );
}
