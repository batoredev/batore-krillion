import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStore, type User } from "./store";
import { hashPassword, newId, newToken, sha256, USERNAME_RE, verifyPassword } from "./passwords";

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

/**
 * First-admin setup for hosts where you can't run `npm run create-admin` (e.g. Cloudflare).
 * Set KRIBATOV_BOOTSTRAP_ADMIN="username:password" and log in with exactly those details.
 * It only works while the database has NO users at all, then does nothing. Remove it after use.
 */
async function bootstrapAdmin(username: string, password: string): Promise<User | null> {
  const spec = process.env.KRIBATOV_BOOTSTRAP_ADMIN;
  if (!spec || !spec.includes(":")) return null;
  const i = spec.indexOf(":");
  const [u, p] = [spec.slice(0, i).trim().toLowerCase(), spec.slice(i + 1)];
  if (!USERNAME_RE.test(u) || p.length < 6 || username.trim().toLowerCase() !== u || password !== p) return null;
  const store = getStore();
  if ((await store.listUsers()).length > 0) return null;
  const user: User = {
    id: newId(), username: u, displayName: u, passwordHash: await hashPassword(p), role: "admin",
    disabled: false, createdAt: new Date().toISOString(), lastLoginAt: null,
  };
  await store.createUser(user);
  return user;
}

export async function login(username: string, password: string, ipKey: string): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const key = `${username.toLowerCase()}|${ipKey}`;
  if (loginLocked(key)) return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  const store = getStore();
  let user = await store.getUserByUsername(username.trim());
  if (!user) user = await bootstrapAdmin(username, password);
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
