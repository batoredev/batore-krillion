import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { statsFor } from "@/lib/results";
import { promptsByTopic } from "@/content";

export const dynamic = "force-dynamic";

export default async function Packs() {
  const user = await requireUser();
  const stats = await statsFor(user.id);
  return (
    <div className="page stack">
      <span className="eyebrow">Topic packs</span>
      <h1 className="title">Pick a heading</h1>
      <p className="muted">Each pack has 10 sets of 7 prompts from one topic. All free, no limits.</p>
      <div className="grid">
        {stats.packs.map((p) => (
          <Link key={p.topic} href={`/packs/${p.topic}`} className="card mode-card">
            <span className="icon">{p.icon}</span>
            <h3 className="h2">{p.name}</h3>
            <span className="muted small">{promptsByTopic(p.topic as never).length} prompts · {p.completed}/{p.total} sets cleared</span>
            <div className="progress"><i style={{ width: `${(p.completed / p.total) * 100}%` }} /></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
