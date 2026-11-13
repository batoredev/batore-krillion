import { body, fail, json, withUser } from "@/lib/http";
import { generatePassword, hashPassword, MIN_PASSWORD } from "@/lib/passwords";
import { getStore } from "@/lib/store";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withUser(async (admin) => {
    const { id } = await ctx.params;
    const store = getStore();
    const target = await store.getUserById(id);
    if (!target) return fail("User not found", 404);
    const b = await body<{ action?: string; password?: string; displayName?: string }>(req);

    if (b.action === "reset-password") {
      const password = b.password ? String(b.password) : generatePassword();
      if (password.length < MIN_PASSWORD) return fail(`Password must be at least ${MIN_PASSWORD} characters.`);
      await store.updateUser(id, { passwordHash: await hashPassword(password) });
      await store.deleteSessionsForUser(id); // log them out everywhere
      return json({ ok: true, password });
    }
    if (b.action === "disable" || b.action === "enable") {
      if (id === admin.id) return fail("You can't disable your own account.");
      await store.updateUser(id, { disabled: b.action === "disable" });
      if (b.action === "disable") await store.deleteSessionsForUser(id);
      return json({ ok: true });
    }
    if (b.action === "rename") {
      const displayName = String(b.displayName ?? "").trim().slice(0, 40);
      if (!displayName) return fail("Display name can't be empty.");
      await store.updateUser(id, { displayName });
      return json({ ok: true });
    }
    return fail("Unknown action");
  }, { admin: true });
}
