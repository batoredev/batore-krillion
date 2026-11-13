import { body, fail, json, withUser } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function POST(req: Request) {
  return withUser(async (user) => {
    const { username } = await body<{ username?: string }>(req);
    const store = getStore();
    const friend = username ? await store.getUserByUsername(String(username).trim()) : null;
    if (!friend || friend.disabled) return fail("No player with that username.");
    if (friend.id === user.id) return fail("That's you!");
    await store.addFriendship(user.id, friend.id);
    return json({ ok: true, friend: { id: friend.id, username: friend.username, displayName: friend.displayName } });
  });
}

export async function DELETE(req: Request) {
  return withUser(async (user) => {
    const { userId } = await body<{ userId?: string }>(req);
    if (!userId) return fail("Missing userId");
    await getStore().removeFriendship(user.id, userId);
    return json({ ok: true });
  });
}
