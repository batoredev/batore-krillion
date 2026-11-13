import { PlayPage } from "@/components/PlayPage";
import { dailySet } from "@/game/sets";
import { todayDailyNumber } from "@/game/time";

export const dynamic = "force-dynamic";
export default async function TodayDaily() {
  return <PlayPage set={dailySet(todayDailyNumber())} />;
}
