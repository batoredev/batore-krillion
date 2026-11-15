import { partyEnabled } from "@/party/enabled";
import { partyTransport } from "@/party/transport";
import { fail, json, withUser } from "@/lib/http";
import { quickPlay } from "@/party/hub";
import { doQuickPlay } from "@/party/do-client";

export async function POST() {
  if (!partyEnabled()) return fail("Party mode is off on this server", 503);
  return withUser(async (user) => {
    const who = { userId: user.id, name: user.displayName };
    return json({ code: partyTransport() === "do" ? await doQuickPlay(who) : quickPlay(who) });
  });
}
