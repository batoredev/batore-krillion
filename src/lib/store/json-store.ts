import { promises as fs } from "fs";
import path from "path";
import type { Friendship, Result, Session, Store, User } from "./types";

interface Data { users: User[]; sessions: Session[]; results: Result[]; friendships: Friendship[] }
const empty = (): Data => ({ users: [], sessions: [], results: [], friendships: [] });

/**
 * Single-file JSON store for development and small self-hosted deployments.
 * Data is held in memory and written atomically (temp file + rename) after every change.
 * Writes are serialised through a promise chain so concurrent requests can't interleave.
 */
export class JsonStore implements Store {
  private data: Data | null = null;
  private loading: Promise<Data> | null = null;
  private writeChain: Promise<void> = Promise.resolve();
  constructor(private file: string) {}

  private async load(): Promise<Data> {
    if (this.data) return this.data;
    if (!this.loading) {
      this.loading = (async () => {
        try {
          const raw = await fs.readFile(this.file, "utf8");
          this.data = { ...empty(), ...JSON.parse(raw) };
        } catch (e: unknown) {
          if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
          this.data = empty();
        }
        return this.data!;
      })();
    }
    return this.loading;
  }

  private async mutate(fn: (d: Data) => void): Promise<void> {
    const d = await this.load();
    fn(d);
    const snapshot = JSON.stringify(d);
    this.writeChain = this.writeChain.then(async () => {
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, snapshot);
      await fs.rename(tmp, this.file);
    });
    return this.writeChain;
  }

  async getUserById(id: string) { return (await this.load()).users.find((u) => u.id === id) ?? null; }
  async getUserByUsername(username: string) {
    const n = username.toLowerCase();
    return (await this.load()).users.find((u) => u.username === n) ?? null;
  }
  async listUsers() { return [...(await this.load()).users]; }
  async createUser(u: User) {
    await this.mutate((d) => {
      if (d.users.some((x) => x.username === u.username)) throw new Error("USERNAME_TAKEN");
      d.users.push(u);
    });
  }
  async updateUser(id: string, patch: Partial<Omit<User, "id">>) {
    await this.mutate((d) => { const u = d.users.find((x) => x.id === id); if (u) Object.assign(u, patch); });
  }

  async createSession(s: Session) {
    await this.mutate((d) => {
      const now = new Date().toISOString();
      d.sessions = d.sessions.filter((x) => x.expiresAt > now);
      d.sessions.push(s);
    });
  }
  async getSession(tokenHash: string) { return (await this.load()).sessions.find((s) => s.tokenHash === tokenHash) ?? null; }
  async deleteSession(tokenHash: string) { await this.mutate((d) => { d.sessions = d.sessions.filter((s) => s.tokenHash !== tokenHash); }); }
  async deleteSessionsForUser(userId: string) { await this.mutate((d) => { d.sessions = d.sessions.filter((s) => s.userId !== userId); }); }

  async addResult(r: Result) { await this.mutate((d) => { d.results.push(r); }); }
  async listResultsForUser(userId: string) { return (await this.load()).results.filter((r) => r.userId === userId); }
  async listResultsForSet(setKey: string) { return (await this.load()).results.filter((r) => r.setKey === setKey); }

  async addFriendship(userId: string, friendId: string) {
    await this.mutate((d) => {
      const now = new Date().toISOString();
      for (const [a, b] of [[userId, friendId], [friendId, userId]]) {
        if (!d.friendships.some((f) => f.userId === a && f.friendId === b)) d.friendships.push({ userId: a, friendId: b, createdAt: now });
      }
    });
  }
  async removeFriendship(userId: string, friendId: string) {
    await this.mutate((d) => {
      d.friendships = d.friendships.filter((f) => !((f.userId === userId && f.friendId === friendId) || (f.userId === friendId && f.friendId === userId)));
    });
  }
  async listFriendIds(userId: string) { return (await this.load()).friendships.filter((f) => f.userId === userId).map((f) => f.friendId); }
}
