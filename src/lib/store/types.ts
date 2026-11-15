import type { TierKey } from "@/game/tiers";

export type Role = "admin" | "player";

export interface User {
  id: string;
  username: string;      // lowercase, unique, used to log in
  displayName: string;
  passwordHash: string;
  role: Role;
  disabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface Session {
  tokenHash: string;     // sha256 of the cookie token; the raw token is never stored
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface RoundRecord {
  promptId: string;
  guess: string | null;  // what the player typed for the accepted answer (null = ran out of time)
  answer: string | null; // the canonical answer it matched
  tier: TierKey | null;
  points: number;
}

export interface Result {
  id: string;
  userId: string;
  setKey: string;
  mode: "daily" | "endless" | "pack";
  dailyNumber: number | null;
  playedOnDate: string;     // IST calendar date
  rounds: RoundRecord[];
  score: number;
  firstAttempt: boolean;    // first time this player finished this set
  countsForStreak: boolean; // first attempt at the daily, on its own day
  createdAt: string;
}

export interface Friendship { userId: string; friendId: string; createdAt: string }

/** A guess that was not accepted, kept so an admin can review it. */
export interface MissedGuess { id: string; promptId: string; guess: string; key: string; userId: string; createdAt: string }

/** An answer an admin added on top of the built-in lists. Applies immediately, no redeploy. */
export interface AnswerAddition {
  id: string; promptId: string; answer: string; aliases: string[];
  tier: "ground" | "decoy" | "orbit" | "moonshot" | "deep";
  addedBy: string; createdAt: string;
}

/**
 * Everything the app needs from storage. The JSON-file implementation is used today;
 * a Supabase implementation of this same interface replaces it later (see supabase/schema.sql).
 */
export interface Store {
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  createUser(u: User): Promise<void>;
  updateUser(id: string, patch: Partial<Omit<User, "id">>): Promise<void>;

  createSession(s: Session): Promise<void>;
  getSession(tokenHash: string): Promise<Session | null>;
  deleteSession(tokenHash: string): Promise<void>;
  deleteSessionsForUser(userId: string): Promise<void>;

  addResult(r: Result): Promise<void>;
  listResultsForUser(userId: string): Promise<Result[]>;
  listResultsForSet(setKey: string): Promise<Result[]>;

  addFriendship(userId: string, friendId: string): Promise<void>;
  removeFriendship(userId: string, friendId: string): Promise<void>;
  listFriendIds(userId: string): Promise<string[]>;

  addMissedGuess(m: MissedGuess): Promise<void>;
  listMissedGuesses(limit: number): Promise<MissedGuess[]>;
  deleteMissedGuesses(promptId: string, key: string): Promise<void>;

  listAnswerAdditions(): Promise<AnswerAddition[]>;
  addAnswerAddition(a: AnswerAddition): Promise<void>;
  deleteAnswerAddition(id: string): Promise<void>;
}
