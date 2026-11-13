import { body, json, withUser } from "@/lib/http";
import { submitResult, type SubmittedRound } from "@/lib/results";

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { setKey, rounds } = await body<{ setKey?: string; rounds?: SubmittedRound[] }>(req);
    if (!setKey || !rounds) throw new Error("Missing setKey or rounds");
    return json(await submitResult(user, setKey, rounds));
  });
}
