// Short-lived signed tickets that let a logged-in player open a party WebSocket.
// The Next.js app (which knows the session) signs; the Cloudflare worker verifies, without a database call.
// Uses Web Crypto, so it runs in both Node and Cloudflare Workers.

export interface Ticket { u: string; n: string; c: string; exp: number }

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

/** Secret for signing: KRIBATOV_PARTY_SECRET if set, else derived from the Supabase secret key. */
export function ticketSecret(env: Record<string, unknown>): string | null {
  const s = (env.KRIBATOV_PARTY_SECRET as string) || (env.SUPABASE_SERVICE_ROLE_KEY ? `kribatov-party:${env.SUPABASE_SERVICE_ROLE_KEY}` : "");
  return s || null;
}

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Signs any JSON object with an expiry; returns "payload.signature". */
export async function signData<T extends object>(data: T, secret: string, ttlMs: number): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ ...data, exp: Date.now() + ttlMs })));
  return `${payload}.${b64url(await hmac(secret, payload))}`;
}

/** Verifies a token from signData; null if forged, malformed or expired. */
export async function verifyData<T extends object>(token: string | null | undefined, secret: string): Promise<(T & { exp: number }) | null> {
  return (await verifyTicket(token ?? null, secret)) as unknown as (T & { exp: number }) | null;
}

export async function signTicket(t: Omit<Ticket, "exp">, secret: string, ttlMs = 60_000): Promise<string> {
  return signData(t, secret, ttlMs);
}

export async function verifyTicket(token: string | null, secret: string): Promise<Ticket | null> {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = await hmac(secret, payload);
  let got: Uint8Array;
  try { got = fromB64url(sig); } catch { return null; } // malformed signature
  if (got.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ expected[i];
  if (diff) return null;
  try {
    const t = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as Ticket;
    return t.exp > Date.now() ? t : null;
  } catch { return null; }
}
