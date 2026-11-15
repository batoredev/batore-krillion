import { partyEnabled } from "@/party/enabled";
import { body, fail, json, withUser } from "@/lib/http";
import { createRoom, listPublicRooms } from "@/party/hub";
import type { PartySettings } from "@/party/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!partyEnabled()) return fail("Party mode is off on this server", 503);
  return withUser(async () => json({ rooms: listPublicRooms() }));
}

export async function POST(req: Request) {
  if (!partyEnabled()) return fail("Party mode is off on this server", 503);
  return withUser(async (user) => {
    const settings = await body<Partial<PartySettings>>(req);
    return json({ code: createRoom({ userId: user.id, name: user.displayName }, settings) });
  });
}
