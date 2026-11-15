// Hot Comet keeps live rooms in server memory, which needs one long-running server.
// On Cloudflare Workers that isn't the case, so it is switched off there (KRIBATOV_DISABLE_PARTY=1)
// until the Durable Objects version exists.
export const partyEnabled = () => process.env.KRIBATOV_DISABLE_PARTY !== "1";
