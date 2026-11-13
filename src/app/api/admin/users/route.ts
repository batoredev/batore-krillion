import { body, fail, json, withUser } from "@/lib/http";
import { generatePassword, hashPassword, MIN_PASSWORD, newId, USERNAME_RE } from "@/lib/passwords";
import { getStore } from "@/lib/store";

export async function POST(req: Request) {
  return withUser(async () => {
    const b = await body<{ username?: string; displayName?: string; password?: string; role?: string }>(req);
    const username = String(b.username ?? "").trim().toLowerCase();
    if (!USERNAME_RE.test(username)) return fail("Username must be 3–20 characters: lowercase letters, numbers or _.");
    const password = b.password ? String(b.password) : generatePassword();
    if (password.length < MIN_PASSWORD) return fail(`Password must be at least ${MIN_PASSWORD} characters.`);
    const displayName = String(b.displayName ?? "").trim().slice(0, 40) || username;
    const store = getStore();
    if (await store.getUserByUsername(username)) return fail("That username is already taken.");
    const user = {
      id: newId(), username, displayName, passwordHash: await hashPassword(password),
      role: b.role === "admin" ? ("admin" as const) : ("player" as const),
      disabled: false, createdAt: new Date().toISOString(), lastLoginAt: null,
    };
    await store.createUser(user);
    // The plain password is returned exactly once so the admin can hand it over.
    return json({ user: { id: user.id, username, displayName, role: user.role }, password });
  }, { admin: true });
}
