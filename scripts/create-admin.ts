// Usage: npm run create-admin -- <username> [password] [display name]
// Creates an admin account. If no password is given, one is generated and printed once.
import "./env";
import { getStore } from "../src/lib/store";
import { generatePassword, hashPassword, MIN_PASSWORD, newId, USERNAME_RE } from "../src/lib/passwords";

async function main() {
  const [rawUser, rawPass, ...nameParts] = process.argv.slice(2);
  const username = (rawUser ?? "").toLowerCase();
  if (!USERNAME_RE.test(username)) {
    console.error("Usage: npm run create-admin -- <username> [password] [display name]\nUsername: 3–20 lowercase letters, numbers or _.");
    process.exit(1);
  }
  const password = rawPass || generatePassword();
  if (password.length < MIN_PASSWORD) { console.error(`Password must be at least ${MIN_PASSWORD} characters.`); process.exit(1); }
  const store = getStore();
  if (await store.getUserByUsername(username)) { console.error(`User "${username}" already exists. Use npm run reset-password instead.`); process.exit(1); }
  await store.createUser({
    id: newId(), username, displayName: nameParts.join(" ") || username, passwordHash: await hashPassword(password),
    role: "admin", disabled: false, createdAt: new Date().toISOString(), lastLoginAt: null,
  });
  console.log(`\nAdmin created.\n  Username: ${username}\n  Password: ${password}\n\nLog in, then create player accounts from /admin.`);
}
main();
