import { json, withUser } from "@/lib/http";
import { leaderboard } from "@/lib/results";

export async function GET(req: Request) {
  return withUser(async (user) => {
    const url = new URL(req.url);
    const setKey = url.searchParams.get("set") ?? "";
    const scope = url.searchParams.get("scope") === "friends" ? "friends" : "global";
    return json({ rows: await leaderboard(setKey, user.id, scope) });
  });
}
