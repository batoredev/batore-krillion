import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import type { User } from "./store";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Runs a handler with the logged-in user (401 if none, 403 if admin is required and missing). */
export async function withUser(fn: (u: User) => Promise<Response>, opts: { admin?: boolean } = {}): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return fail("Not logged in", 401);
  if (opts.admin && user.role !== "admin") return fail("Admins only", 403);
  try {
    return await fn(user);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Something went wrong", 400);
  }
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { return {} as T; }
}
