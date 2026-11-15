import { body, json, withUser } from "@/lib/http";
import { startRound } from "@/lib/play";

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { setKey, round } = await body<{ setKey?: string; round?: number }>(req);
    return json(await startRound(user, String(setKey ?? ""), Number(round)));
  });
}
