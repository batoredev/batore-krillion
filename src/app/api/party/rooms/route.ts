import { body, json, withUser } from "@/lib/http";
import { createRoom, listPublicRooms } from "@/party/hub";
import type { PartySettings } from "@/party/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  return withUser(async () => json({ rooms: listPublicRooms() }));
}

export async function POST(req: Request) {
  return withUser(async (user) => {
    const settings = await body<Partial<PartySettings>>(req);
    return json({ code: createRoom({ userId: user.id, name: user.displayName }, settings) });
  });
}
