import { PlayPage } from "@/components/PlayPage";
import { PACK_SETS, setFromKey } from "@/game/sets";

export default async function PackSet({ params }: { params: Promise<{ topic: string; n: string }> }) {
  const { topic, n } = await params;
  const num = Number(n);
  return <PlayPage set={setFromKey(`pack:${topic}:${n}`)} nextHref={num < PACK_SETS ? `/play/pack/${topic}/${num + 1}` : `/packs/${topic}`} />;
}
