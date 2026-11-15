// "memory": rooms live in this Node process (local dev, a single server). Uses Server-Sent Events.
// "do": rooms are Cloudflare Durable Objects (production on Cloudflare). Uses WebSockets.
export type PartyTransport = "memory" | "do";
export const partyTransport = (): PartyTransport => (process.env.KRIBATOV_PARTY_TRANSPORT === "do" ? "do" : "memory");
