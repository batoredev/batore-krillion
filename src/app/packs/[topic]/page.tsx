import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { firstScores } from "@/lib/results";
import { topicById, type TopicId } from "@/content/types";
import { promptsByTopic } from "@/content";
import { PACK_SETS } from "@/game/sets";
import { MAX_SCORE } from "@/game/tiers";

export default async function Pack({ params }: { params: Promise<{ topic: string }> }) {
  const user = await requireUser();
  const { topic } = await params;
  const t = topicById(topic);
  if (!t) notFound();
  const scores = await firstScores(user.id);
  const prompts = promptsByTopic(topic as TopicId);
  return (
    <div className="page stack">
      <Link href="/packs" className="muted small">← All packs</Link>
      <span className="eyebrow">{t.icon} Topic pack</span>
      <h1 className="title">{t.name}</h1>
      <p className="muted">{prompts.length} prompts, shuffled into {PACK_SETS} sets.</p>
      <div className="archive-grid">
        {Array.from({ length: PACK_SETS }, (_, i) => i + 1).map((n) => {
          const s = scores[`pack:${topic}:${n}`];
          return (
            <Link key={n} href={`/play/pack/${topic}/${n}`} className={`archive-cell ${s !== undefined ? "done" : ""}`}>
              <strong>Set {n}</strong>
              <span className="small mono">{s !== undefined ? `${s}/${MAX_SCORE} km` : "Not played"}</span>
            </Link>
          );
        })}
      </div>
      <details className="card">
        <summary className="muted" style={{ cursor: "pointer" }}>Prompts in this pack</summary>
        <ul className="small muted" style={{ marginBottom: 0 }}>{prompts.map((p) => <li key={p.id}>{p.text}</li>)}</ul>
      </details>
    </div>
  );
}
