import { body, fail, json, withUser } from "@/lib/http";
import { hashPassword, MIN_PASSWORD, verifyPassword } from "@/lib/passwords";
import { getStore } from "@/lib/store";

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { current, next } = await body<{ current?: string; next?: string }>(req);
    if (!current || !(await verifyPassword(current, user.passwordHash))) return fail("Your current password is wrong.");
    if (!next || next.length < MIN_PASSWORD) return fail(`New password must be at least ${MIN_PASSWORD} characters.`);
    await getStore().updateUser(user.id, { passwordHash: await hashPassword(next) });
    return json({ ok: true });
  });
}
