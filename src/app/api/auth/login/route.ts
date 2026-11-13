import { login, toPublic } from "@/lib/auth";
import { body, fail, json } from "@/lib/http";

export async function POST(req: Request) {
  const { username, password } = await body<{ username?: string; password?: string }>(req);
  if (!username || !password) return fail("Enter your username and password.");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const r = await login(String(username), String(password), ip);
  return r.ok ? json({ user: toPublic(r.user) }) : fail(r.error, 401);
}
