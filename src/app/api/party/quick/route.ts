import { json, withUser } from "@/lib/http";
import { quickPlay } from "@/party/hub";

export async function POST() {
  return withUser(async (user) => json({ code: quickPlay({ userId: user.id, name: user.displayName }) }));
}
