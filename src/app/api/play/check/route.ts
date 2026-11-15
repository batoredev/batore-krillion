import { body, json, withUser } from "@/lib/http";
import { checkGuess } from "@/lib/play";

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { token, guess } = await body<{ token?: string; guess?: string }>(req);
    return json(await checkGuess(user, String(token ?? ""), String(guess ?? "")));
  });
}
