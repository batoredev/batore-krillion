import { requireUser } from "@/lib/auth";
import { PartyLobby } from "./PartyLobby";
import { TOPICS } from "@/content/types";
import { partyEnabled } from "@/party/enabled";

export const dynamic = "force-dynamic";

export default async function PartyPage() {
  await requireUser();
  if (!partyEnabled()) {
    return (
      <div className="page stack">
        <span className="eyebrow">Multiplayer</span>
        <h1 className="title">☄️ Hot Comet</h1>
        <p className="notice">Party mode is coming soon on this server.</p>
      </div>
    );
  }
  return (
    <div className="page stack">
      <span className="eyebrow">Multiplayer</span>
      <h1 className="title">☄️ Hot Comet</h1>
      <p className="muted">
        Holding the comet? Name an answer nobody has used yet to pass it on. The fuse is hidden and random,
        and it keeps burning as the comet moves. Get caught when it blows and you lose a life. Last one flying wins.
      </p>
      <PartyLobby topics={TOPICS.map((t) => ({ id: t.id, name: t.name, icon: t.icon }))} />
    </div>
  );
}
