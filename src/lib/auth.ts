import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStore, type User } from "./store";
import { newToken, sha256, verifyPassword } from "./passwords";

export const SESSION_COOKIE = "kb_session";
const SESSION_DAYS = 30;

export type PublicUser = Pick<User, "id" | "username" | "displayName" | "role">;
export const toPublic = (u: User): PublicUser => ({ id: u.id, username: u.username, displayName: u.displayName, role: u.role });

// Simple in-memory brute-force guard: 8 failures per username+IP in 15 minutes locks that pair out.
const failures = new Map<string, { count: number; first: number }>();
const WINDOW = 15 * 60 * 1000, MAX_FAILS = 8;
export function loginLocked(key: string) {
  const f = failures.get(key);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW) { failures.delete(key); return false; }
  return f.count >= MAX_FAILS;
}
function noteFailure(key: string) {
  const f = failures.get(key);
  if (!f || Date.now() - f.first > WINDOW) failures.set(key, { count: 1, first: Date.now() });
  else f.count++;
}

export async function login(username: string, password: string, ipKey: string): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const key = `${username.toLowerCase()}|${ipKey}`;
  if (loginLocked(key)) return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  const store = getStore();
  const user = await store.getUserByUsername(username.trim());
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) { noteFailure(key); return { ok: false, error: "Wrong username or password." }; }
  if (user.disabled) return { ok: false, error: "This account has been disabled. Contact the admin." };
  failures.delete(key);

  const token = newToken();
  const now = new Date();
  await store.createSession({
    tokenHash: sha256(token), userId: user.id, createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DAYS * 86_400_000).toISOString(),
  });
  await store.updateUser(user.id, { lastLoginAt: now.toISOString() });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && process.env.KRIBATOV_INSECURE_COOKIES !== "1",
    path: "/", maxAge: SESSION_DAYS * 86_400,
  });
  return { ok: true, user };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await getStore().deleteSession(sha256(token));
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const store = getStore();
  const session = await store.getSession(sha256(token));
  if (!session || session.expiresAt < new Date().toISOString()) return null;
  const user = await store.getUserById(session.userId);
  return user && !user.disabled ? user : null;
}

/** For pages: the logged-in user, or a redirect to /login. */
export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}
export async function requireAdmin(): Promise<User> {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  return u;
}
