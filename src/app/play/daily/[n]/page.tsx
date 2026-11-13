import { PlayPage } from "@/components/PlayPage";
import { setFromKey } from "@/game/sets";

export default async function ArchiveDaily({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return <PlayPage set={setFromKey(`daily:${n}`)} />;
}
