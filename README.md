# Kribatov

A daily trivia game about rarity. Each set has 7 prompts ("Name an Indian sweet") with 25 seconds each. Any valid answer is accepted, but **rarer answers score more** and launch your rocket higher. A perfect launch reaches 700 km.

## Rules

| Tier | Points | Meaning |
|---|---|---|
| 🌟 Kribatov | 100 | The single hand-picked gem for the prompt |
| 🟥 Deep Space | 85 | Deep cut |
| 🟪 Moonshot | 60 | Rare |
| 🟦 Orbit | 30 | Uncommon |
| 🟫 Decoy | 15 | The "clever" pick that lots of people think of |
| ⬜ Ground Control | 10 | The obvious answer |

- 7 prompts per set, 25 seconds each, maximum 700.
- A wrong answer shows "not on the list" and you can keep guessing until the clock runs out. Running out scores 0.
- Matching is forgiving:
  - Capitals, accents, punctuation and a leading "the" are ignored.
  - Aliases count, so "Bangalore" matches "Bengaluru".
  - Typos: 1 for words of 5–7 letters, 2 for 8+.
- **Daily:** the same 7 prompts for everyone. It resets at midnight IST, and Daily #1 is 13 Nov 2026.
- **No limits:** replay anything as often as you like. Only your **first run** of a set counts toward streaks, percentiles and leaderboards. Archive replays don't extend a streak.
- **Streak badges:** 1, 5, 14, 30 and 45 days.
- **Modes:**
  - **Daily**
  - **Endless:** unlimited random mixed sets.
  - **Archive:** every past daily.
  - **Topic packs:** 12 topics × 10 sets.

## Party mode: Hot Comet (multiplayer)

Up to 10 players, at `/party`.

- **Turns:** whoever holds the ☄️ comet must name a valid answer to the prompt that **nobody has used yet**. Doing so passes the comet to the next player.
- **Feedback:** wrong answers and repeats are rejected, and the holder can keep trying. Everyone sees what the holder is typing, live.
- **Hidden fuse:** a random 10–30 seconds, shared across the room and never sent to browsers. It keeps burning as the comet moves, so the next player inherits the time left. If less than 8 seconds remain at a pass, it's topped up to 8.
- **Lives:** when the fuse runs out, the holder loses a life. After a 3-second break a new prompt and a new fuse start, with the next player holding the comet. At 0 lives you're out, and the last player standing wins.
- **Rooms:** public (listed) or private (code only), joined by 4-letter code, invite link or **Quick play**.
- **Host controls:**
  - Lives: 1–5.
  - Room size: 1v1, 3, 4–6 or 8–10.
  - Topic: all, or one topic.
  - Fuse speed: standard, frantic or relaxed.
  - Start, and play again.
- **Joining late:** people who join mid-game watch as spectators and join the next round.
- **Results:** the standings show finishing place, answers given, rarest tier and rarity points.

How it's built:
- `src/party/engine.ts` holds the rules as a pure state machine. Time and randomness are passed in, so it's fully testable (`scripts/test-party.ts`).
- `src/party/hub.ts` holds rooms **in memory** in the Node server, runs the fuse timers and streams state to browsers over Server-Sent Events (`/api/party/[code]/events`). Actions go to `POST /api/party/[code]/action`.

## Accounts

There is **no public sign-up**. An admin creates every account, and every page needs a login.

1. Create the first admin:
   ```bash
   npm run create-admin -- <username> [password] [Display Name]
   ```
   If you leave out the password, one is generated and printed once.
2. Log in and open **/admin**. From there you can:
   - Create players. Leave the password blank to auto-generate one; it's shown once.
   - Reset passwords.
   - Disable or re-enable accounts.
3. Players can change their own password at **/account**.
4. Lost admin password:
   ```bash
   npm run reset-password -- <username>
   ```

Passwords are hashed with scrypt. Sessions are random tokens in an httpOnly cookie, and only their SHA-256 is stored. Repeated failed logins lock that username and IP pair for 15 minutes.

## Running it

```bash
npm install
npm run create-admin -- captain
npm run dev          # http://localhost:3000
```

Production:
```bash
npm run build
npm start
```

Data is stored in `data/db.json`, which is git-ignored. Set `KRIBATOV_DATA_DIR` to put it somewhere else.

Other scripts:
- `npm test`: engine tests (matching, tiers, set selection, IST dates) and party rules tests.
- `npm run validate-content`: checks every prompt. Add `-- --warnings` to list answers close enough to be confused by typo matching.
- `npm run typecheck`

## Content

**360 prompts across 12 topics (30 each), about 23,500 accepted answers.**

The topics are Automobiles, Global Cuisine, Geography, History, Current Affairs, General Trivia, Indian Geography, Indian Movies, Indian Cuisine, Indian History & Politics, Indian Trivia and General Movies.

- `src/content/prompts/*.ts` holds the original 88 prompts, in play from Daily #1.
- `src/content/prompts/batch2/*.ts` holds 272 more, including the whole General Movies topic. They're in play from Daily #2 onwards.

Every prompt carries a `since` daily number, and a daily only draws from prompts that existed on its day. Adding content therefore never changes a past daily in the archive. Wrap a new batch in `fromDaily(<first daily number>, [...])`, as `batch2/index.ts` does.

Review regularly:
- **Current Affairs:** office-holders and memberships change.
- **Indian History & Politics:** the "current" Chief Minister and Vice President entries.

## Adding or editing prompts

Prompts live in `src/content/prompts/<topic>.ts`:

```ts
p("ic-sweet", T, "Name an Indian sweet (mithai)", {
  ground:   "Gulab jamun; Rasgulla|rasagola|rosogolla; Jalebi",
  decoy:    "Kheer",
  orbit:    "...",
  moonshot: "...",
  deep:     "...",
  gem:      "Ledikeni",          // exactly one
}),
```

- Answers are separated by `;`, and aliases by `|`. The first name is the one players see.
- If an answer appears in two tiers, the higher tier wins.
- Run `npm run validate-content` after editing.
- Put new prompts in a new batch file wrapped in `fromDaily(...)` so past dailies stay unchanged. Topic packs are reshuffled when a topic grows; dailies are not.

Topics are listed in `src/content/types.ts`. To add a topic, add it there, create its file, and register it in `src/content/index.ts`.

## Project layout

```
src/
  game/        tiers & scoring, answer matching, set selection, IST dates
  content/     the 11 topics and their prompts
  lib/         auth, passwords, results/stats/leaderboards, storage
  lib/store/   Store interface + JSON-file implementation
  components/  Game, Results, AltitudeRail, Nav
  app/         pages and API routes (Next.js App Router)
supabase/      schema.sql for the move to Supabase
scripts/       create-admin, reset-password, validate-content, test-engine
```

## Supabase (database)

Storage goes through the `Store` interface (`src/lib/store/types.ts`), which has two implementations:

- **JSON file** (`data/db.json`): used when no Supabase settings are present. Good for local testing.
- **Supabase** (`src/lib/store/supabase-store.ts`): used automatically when both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.

To set up Supabase:

1. In the Supabase dashboard, open **SQL Editor**, paste in `supabase/schema.sql` and click **Run**.
2. Copy `.env.example` to `.env.local` and fill in the URL and the **secret (service-role) key**. Never commit `.env.local`.
3. Check the setup:
   ```bash
   npm run check-supabase
   ```
4. Optionally, copy existing local data from `data/db.json` into Supabase:
   ```bash
   npm run migrate-to-supabase
   ```
5. Create the first admin. It now goes into Supabase:
   ```bash
   npm run create-admin -- yourname
   ```

`npm run test-supabase` runs a full round trip against the real project. It creates throwaway `zz_test_*` rows and deletes them afterwards.

Accounts stay as Kribatov's own username/password, not Supabase Auth. The secret key is used only on the server, never in the browser.

## Cloudflare (hosting)

The app runs on Cloudflare Workers through the OpenNext adapter (`wrangler.jsonc`, `open-next.config.ts`).

- **Build command:** `npx opennextjs-cloudflare build`
- **Deploy command:** `npx opennextjs-cloudflare deploy`
- **Worker name:** `kribatov` (it must match `name` in `wrangler.jsonc`)
- **Settings in `wrangler.jsonc`:** `SUPABASE_URL` and `KRIBATOV_DISABLE_PARTY=1`, which are not secret.
- **Secrets to add in the dashboard** (as type **Secret**, not text):
  - `SUPABASE_SERVICE_ROLE_KEY`: the Supabase secret or service_role key.
  - `KRIBATOV_BOOTSTRAP_ADMIN`: `username:password`, used once to create the first admin. Logging in with those details creates the admin, but only while the database has no users. Delete this secret afterwards.
- **Local preview in the Workers runtime:**
  ```bash
  npm run cf:preview
  ```
  This needs a `.dev.vars` file containing `SUPABASE_SERVICE_ROLE_KEY=...`.

For party mode on Cloudflare: Cloudflare Workers don't keep one long-lived process, so the in-memory `src/party/hub.ts` must be replaced. Two options:

- **Cloudflare Durable Objects:** one object per room. It runs `engine.ts` unchanged, uses a Durable Object alarm for the fuse, and connects players with WebSockets.
- **Supabase Realtime:** broadcast channels per room, with one authority applying actions and running the timer.

Either way, the rules in `engine.ts` don't change.

## Known limitations

- Answer lists are sent to the browser for the current set, so a technical player could read them. Scores are always recalculated on the server, but the answers themselves aren't secret. Moving matching to the server fixes this.
- The JSON store is meant for a single server process. Use Supabase for anything bigger.
- Party rooms live in server memory: a restart ends running games. One server process only, until the hub is moved to Durable Objects or Supabase.
- Party results aren't saved to player stats yet.
- Not built yet: password reset by email.
