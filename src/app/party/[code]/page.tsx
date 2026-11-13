import { requireUser } from "@/lib/auth";
import { PartyRoom } from "./PartyRoom";
import { TOPICS } from "@/content/types";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireUser();
  const { code } = await params;
  return <PartyRoom code={code.toUpperCase()} me={user.id} topics={TOPICS.map((t) => ({ id: t.id, name: t.name, icon: t.icon }))} />;
}
