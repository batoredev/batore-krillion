import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Friendship, Result, Session, Store, User } from "./types";

// Supabase (Postgres) implementation of the Store. Tables come from supabase/schema.sql.
// Uses the service-role key, so it must only ever run on the server.

type Row = Record<string, unknown>;
const iso = (v: unknown) => (v == null ? null : new Date(String(v)).toISOString());

const toUser = (r: Row): User => ({
  id: String(r.id), username: String(r.username), displayName: String(r.display_name),
  passwordHash: String(r.password_hash), role: r.role as User["role"], disabled: Boolean(r.disabled),
  createdAt: iso(r.created_at)!, lastLoginAt: iso(r.last_login_at),
});
const userPatch = (p: Partial<Omit<User, "id">>): Row => {
  const out: Row = {};
  if (p.username !== undefined) out.username = p.username;
  if (p.displayName !== undefined) out.display_name = p.displayName;
  if (p.passwordHash !== undefined) out.password_hash = p.passwordHash;
  if (p.role !== undefined) out.role = p.role;
  if (p.disabled !== undefined) out.disabled = p.disabled;
  if (p.createdAt !== undefined) out.created_at = p.createdAt;
  if (p.lastLoginAt !== undefined) out.last_login_at = p.lastLoginAt;
  return out;
};
const toSession = (r: Row): Session => ({
  tokenHash: String(r.token_hash), userId: String(r.user_id), createdAt: iso(r.created_at)!, expiresAt: iso(r.expires_at)!,
});
const toResult = (r: Row): Result => ({
  id: String(r.id), userId: String(r.user_id), setKey: String(r.set_key), mode: r.mode as Result["mode"],
  dailyNumber: r.daily_number == null ? null : Number(r.daily_number), playedOnDate: String(r.played_on_date),
  rounds: r.rounds as Result["rounds"], score: Number(r.score), firstAttempt: Boolean(r.first_attempt),
  countsForStreak: Boolean(r.counts_for_streak), createdAt: iso(r.created_at)!,
});
const fromResult = (r: Result): Row => ({
  id: r.id, user_id: r.userId, set_key: r.setKey, mode: r.mode, daily_number: r.dailyNumber,
  played_on_date: r.playedOnDate, rounds: r.rounds, score: r.score, first_attempt: r.firstAttempt,
  counts_for_streak: r.countsForStreak, created_at: r.createdAt,
});

function check<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
  if (res.error) throw Object.assign(new Error(`Supabase: ${res.error.message}`), { code: res.error.code });
  return res.data;
}

export class SupabaseStore implements Store {
  private db: SupabaseClient;
  constructor(url: string, serviceKey: string, fetchImpl?: typeof fetch) {
    this.db = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      ...(fetchImpl ? { global: { fetch: fetchImpl } } : {}),
    });
  }

  /** Reads every row of a query, 1000 at a time (Supabase's default page limit). */
  private async all(table: string, filter: (q: any) => any = (q) => q): Promise<Row[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
    const out: Row[] = [];
    for (let from = 0; ; from += 1000) {
      const page = check(await filter(this.db.from(table).select("*")).range(from, from + 999)) as Row[];
      out.push(...page);
      if (page.length < 1000) return out;
    }
  }

  async getUserById(id: string) {
    const r = check(await this.db.from("users").select("*").eq("id", id).maybeSingle());
    return r ? toUser(r) : null;
  }
  async getUserByUsername(username: string) {
    const r = check(await this.db.from("users").select("*").eq("username", username.toLowerCase()).maybeSingle());
    return r ? toUser(r) : null;
  }
  async listUsers() { return (await this.all("users")).map(toUser); }
  async createUser(u: User) {
    const res = await this.db.from("users").insert({ id: u.id, ...userPatch(u) });
    if (res.error?.code === "23505") throw new Error("USERNAME_TAKEN");
    check(res);
  }
  async updateUser(id: string, patch: Partial<Omit<User, "id">>) {
    check(await this.db.from("users").update(userPatch(patch)).eq("id", id));
  }

  async createSession(s: Session) {
    check(await this.db.from("sessions").insert({ token_hash: s.tokenHash, user_id: s.userId, created_at: s.createdAt, expires_at: s.expiresAt }));
    // Opportunistic cleanup of expired sessions.
    if (Math.random() < 0.05) await this.db.from("sessions").delete().lt("expires_at", new Date().toISOString());
  }
  async getSession(tokenHash: string) {
    const r = check(await this.db.from("sessions").select("*").eq("token_hash", tokenHash).maybeSingle());
    return r ? toSession(r) : null;
  }
  async deleteSession(tokenHash: string) { check(await this.db.from("sessions").delete().eq("token_hash", tokenHash)); }
  async deleteSessionsForUser(userId: string) { check(await this.db.from("sessions").delete().eq("user_id", userId)); }

  async addResult(r: Result) { check(await this.db.from("results").insert(fromResult(r))); }
  async listResultsForUser(userId: string) { return (await this.all("results", (q) => q.eq("user_id", userId).order("created_at"))).map(toResult); }
  async listResultsForSet(setKey: string) { return (await this.all("results", (q) => q.eq("set_key", setKey).order("created_at"))).map(toResult); }

  async addFriendship(userId: string, friendId: string) {
    const now = new Date().toISOString();
    check(await this.db.from("friendships").upsert(
      [{ user_id: userId, friend_id: friendId, created_at: now }, { user_id: friendId, friend_id: userId, created_at: now }],
      { onConflict: "user_id,friend_id", ignoreDuplicates: true },
    ));
  }
  async removeFriendship(userId: string, friendId: string) {
    check(await this.db.from("friendships").delete().eq("user_id", userId).eq("friend_id", friendId));
    check(await this.db.from("friendships").delete().eq("user_id", friendId).eq("friend_id", userId));
  }
  async listFriendIds(userId: string) {
    return (await this.all("friendships", (q) => q.eq("user_id", userId))).map((r) => String((r as Row).friend_id));
  }
}

export type { Friendship };
