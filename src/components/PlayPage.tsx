import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/store";
import type { GameSet } from "@/game/sets";
import { Game } from "./Game";
import { toClientSet } from "@/game/client-set";

export async function PlayPage({ set, nextHref }: { set: GameSet | null; nextHref?: string }) {
  const user = await requireUser();
  if (!set) notFound();
  const mine = await getStore().listResultsForUser(user.id);
  return <Game key={set.key} set={toClientSet(set)} alreadyPlayed={mine.some((r) => r.setKey === set.key)} nextHref={nextHref} />;
}
