// Usage: npm run reset-password -- <username> [new password]
import "./env";
import { getStore } from "../src/lib/store";
import { generatePassword, hashPassword, MIN_PASSWORD } from "../src/lib/passwords";

async function main() {
  const [username, rawPass] = process.argv.slice(2);
  if (!username) { console.error("Usage: npm run reset-password -- <username> [new password]"); process.exit(1); }
  const store = getStore();
  const user = await store.getUserByUsername(username);
  if (!user) { console.error(`No user "${username}".`); process.exit(1); }
  const password = rawPass || generatePassword();
  if (password.length < MIN_PASSWORD) { console.error(`Password must be at least ${MIN_PASSWORD} characters.`); process.exit(1); }
  await store.updateUser(user.id, { passwordHash: await hashPassword(password), disabled: false });
  await store.deleteSessionsForUser(user.id);
  console.log(`\nPassword reset for ${user.username}.\n  New password: ${password}`);
}
main();
