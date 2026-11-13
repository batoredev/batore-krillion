// Days roll over at midnight IST (UTC+05:30).
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 86_400_000;

export const LAUNCH_DATE = "2026-11-13"; // Daily #1

export const istDayIndex = (ms: number = Date.now()) => Math.floor((ms + IST_OFFSET_MS) / DAY_MS);
const launchIndex = Math.floor(Date.parse(LAUNCH_DATE + "T00:00:00Z") / DAY_MS);

/** Today's daily number (1-based). Never below 1. */
export const todayDailyNumber = (ms: number = Date.now()) => Math.max(1, istDayIndex(ms) - launchIndex + 1);

/** IST calendar date (YYYY-MM-DD) for a daily number. */
export function dateForDaily(n: number): string {
  return new Date((launchIndex + n - 1) * DAY_MS).toISOString().slice(0, 10);
}

/** IST calendar date for a timestamp. */
export const istDate = (ms: number = Date.now()) => new Date(istDayIndex(ms) * DAY_MS).toISOString().slice(0, 10);

export function prettyDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
