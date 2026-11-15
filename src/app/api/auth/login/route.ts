import { login, toPublic } from "@/lib/auth";
import { body, fail, json } from "@/lib/http";

export async function POST(req: Request) {
  const { username, password } = await body<{ username?: string; password?: string }>(req);
  if (!username || !password) return fail("Enter your username and password.");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  try {
    const r = await login(String(username), String(password), ip);
    return r.ok ? json({ user: toPublic(r.user) }) : fail(r.error, 401);
  } catch (e) {
    console.error("Login failed:", e);
    return fail("The server can't reach its database. If you're the admin, check SUPABASE_URL and the SUPABASE_SERVICE_ROLE_KEY secret.", 503);
  }
}
