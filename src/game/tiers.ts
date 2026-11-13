// Scoring tiers. Points and structure follow the game rules; names are Kribatov's own.
export const TIER_KEYS = ["ground", "decoy", "orbit", "moonshot", "deep", "gem"] as const;
export type TierKey = (typeof TIER_KEYS)[number];

export interface TierInfo {
  key: TierKey;
  name: string;
  points: number;
  line: string;
  emoji: string;
  color: string;
}

export const TIERS: Record<TierKey, TierInfo> = {
  ground: { key: "ground", name: "Ground Control", points: 10, line: "The answer everyone shouts first.", emoji: "⬜", color: "#9aa4bf" },
  decoy: { key: "decoy", name: "Decoy", points: 15, line: "Felt clever. Half the crew thought of it too.", emoji: "🟫", color: "#c58b5a" },
  orbit: { key: "orbit", name: "Orbit", points: 30, line: "Off the pad and climbing.", emoji: "🟦", color: "#4fa3ff" },
  moonshot: { key: "moonshot", name: "Moonshot", points: 60, line: "Rare air up here.", emoji: "🟪", color: "#a879ff" },
  deep: { key: "deep", name: "Deep Space", points: 85, line: "Way past where most people stop.", emoji: "🟥", color: "#ff5f7e" },
  gem: { key: "gem", name: "Kribatov", points: 100, line: "THE Kribatov. One in a million.", emoji: "🌟", color: "#ffc94a" },
};

export const MISS = { name: "No Liftoff", line: "Never cleared the launch tower.", emoji: "❌", color: "#5a6380" };

export const ROUNDS_PER_SET = 7;
export const SECONDS_PER_PROMPT = 25;
export const MAX_SCORE = ROUNDS_PER_SET * TIERS.gem.points; // 700

export interface Band { min: number; max: number; title: string; line: string }
export const BANDS: Band[] = [
  { min: 0, max: 150, title: "Launchpad", line: "Still on the pad. Plenty of sky left." },
  { min: 151, max: 250, title: "Low Orbit", line: "Circling with the crowd." },
  { min: 251, max: 350, title: "Lunar", line: "Well past the Kármán line. Nice." },
  { min: 351, max: 449, title: "Deep Space", line: "Seriously far out." },
  { min: 450, max: MAX_SCORE, title: "Kribatov", line: "Beyond the map. Absurd." },
];
export const bandFor = (score: number) => BANDS.find((b) => score >= b.min && score <= b.max) ?? BANDS[0];

// Altitude markers for the side meter (1 point = 1 km).
export const ALTITUDE_MARKERS: { km: number; label: string }[] = [
  { km: 12, label: "airliners cruise here" },
  { km: 50, label: "top of the stratosphere" },
  { km: 100, label: "Kármán line — space begins" },
  { km: 160, label: "lowest stable orbit" },
  { km: 250, label: "early crewed flights" },
  { km: 408, label: "the space station circles here" },
  { km: 540, label: "space telescope altitude" },
  { km: 620, label: "sun-synchronous satellites" },
  { km: 700, label: "a perfect launch ends here" },
];

export const STREAK_BADGES = [
  { days: 1, name: "Cadet", line: "Played your first daily" },
  { days: 5, name: "Pilot", line: "5-day streak" },
  { days: 14, name: "Navigator", line: "14-day streak" },
  { days: 30, name: "Commander", line: "30-day streak" },
  { days: 45, name: "Kribatov", line: "45-day streak" },
];
