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
  - **Topic packs:** 11 topics × 10 sets.

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
- `npm test`: engine tests (matching, tiers, set selection, IST dates).
- `npm run validate-content`: checks every prompt. Add `-- --warnings` to list answers close enough to be confused by typo matching.
- `npm run typecheck`

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
- Adding prompts reshuffles which prompts appear in past dailies. Do it before launch, or accept that old archive sets will change.

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

## Moving to Supabase

All storage goes through the `Store` interface in `src/lib/store/types.ts`. To move:

1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. Add a `SupabaseStore` implementing `Store` with `@supabase/supabase-js` and the **service-role key**, which is only ever used on the server.
3. Select it in `src/lib/store/index.ts` when `SUPABASE_URL` is set.

Accounts stay as Kribatov's own username/password, not Supabase Auth.

## Known limitations

- Answer lists are sent to the browser for the current set, so a technical player could read them. Scores are always recalculated on the server, but the answers themselves aren't secret. Moving matching to the server fixes this.
- The JSON store is meant for a single server process. Use Supabase for anything bigger.
- Not built yet: party (multiplayer) mode, and password reset by email.
