import { partyEnabled } from "@/party/enabled";
import { partyTransport } from "@/party/transport";
import { body, fail, json, withUser } from "@/lib/http";
import { createRoom, listPublicRooms } from "@/party/hub";
import { doCreateRoom, doListRooms } from "@/party/do-client";
import type { PartySettings } from "@/party/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!partyEnabled()) return fail("Party mode is off on this server", 503);
  return withUser(async () => json({ rooms: partyTransport() === "do" ? await doListRooms() : listPublicRooms() }));
}

export async function POST(req: Request) {
  if (!partyEnabled()) return fail("Party mode is off on this server", 503);
  return withUser(async (user) => {
    const settings = await body<Partial<PartySettings>>(req);
    const host = { userId: user.id, name: user.displayName };
    return json({ code: partyTransport() === "do" ? await doCreateRoom(host, settings) : createRoom(host, settings) });
  });
}
