import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Readable generated password, e.g. "orbit-7342-lunar". */
export function generatePassword(): string {
  const words = ["orbit", "lunar", "comet", "nova", "rocket", "pulsar", "meteor", "quasar", "zenith", "nebula", "apogee", "galaxy"];
  const pick = () => words[randomBytes(1)[0] % words.length];
  const num = (randomBytes(2).readUInt16BE(0) % 9000) + 1000;
  return `${pick()}-${num}-${pick()}`;
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const newId = () => randomBytes(12).toString("hex");
export const newToken = () => randomBytes(32).toString("base64url");

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const MIN_PASSWORD = 6;
