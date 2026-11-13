import { PlayPage } from "@/components/PlayPage";
import { setFromKey } from "@/game/sets";

export default async function Endless({ params }: { params: Promise<{ seed: string }> }) {
  const { seed } = await params;
  return <PlayPage set={setFromKey(`endless:${seed}`)} nextHref="/play/endless" />;
}
