import { partyEnabled } from "@/party/enabled";
import { fail, json, withUser } from "@/lib/http";
import { quickPlay } from "@/party/hub";

export async function POST() {
  if (!partyEnabled()) return fail("Party mode is off on this server", 503);
  return withUser(async (user) => json({ code: quickPlay({ userId: user.id, name: user.displayName }) }));
}
