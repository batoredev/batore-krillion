-- Kribatov schema for Supabase (Postgres).
-- Mirrors src/lib/store/types.ts. Accounts are Kribatov's own (username + password
-- created by an admin), NOT Supabase Auth, so all access goes through the Next.js
-- server using the service-role key. RLS is enabled with no policies, which blocks
-- direct access from browsers using the anon key.

create table if not exists users (
  id             text primary key,
  username       text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name   text not null,
  password_hash  text not null,
  role           text not null default 'player' check (role in ('admin', 'player')),
  disabled       boolean not null default false,
  created_at     timestamptz not null default now(),
  last_login_at  timestamptz
);

create table if not exists sessions (
  token_hash  text primary key,
  user_id     text not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
create index if not exists sessions_user_idx on sessions(user_id);

create table if not exists results (
  id                text primary key,
  user_id           text not null references users(id) on delete cascade,
  set_key           text not null,              -- daily:12 | endless:4839 | pack:indian-movies:3
  mode              text not null check (mode in ('daily', 'endless', 'pack')),
  daily_number      integer,
  played_on_date    date not null,              -- IST calendar date
  rounds            jsonb not null,             -- [{promptId, guess, answer, tier, points}]
  score             integer not null check (score between 0 and 700),
  first_attempt     boolean not null,
  counts_for_streak boolean not null,
  created_at        timestamptz not null default now()
);
create index if not exists results_user_idx on results(user_id);
create index if not exists results_set_first_idx on results(set_key) where first_attempt;

create table if not exists friendships (
  user_id    text not null references users(id) on delete cascade,
  friend_id  text not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

alter table users enable row level security;
alter table sessions enable row level security;
alter table results enable row level security;
alter table friendships enable row level security;

-- Missing-answer review (also in migrations/002_missing_answers.sql)
create table if not exists missed_guesses (
  id         text primary key,
  prompt_id  text not null,
  guess      text not null,
  key        text not null,              -- normalised guess, used to group spellings
  user_id    text references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists missed_guesses_prompt_key_idx on missed_guesses(prompt_id, key);
create index if not exists missed_guesses_created_idx on missed_guesses(created_at desc);

create table if not exists answer_additions (
  id         text primary key,
  prompt_id  text not null,
  answer     text not null,
  aliases    jsonb not null default '[]'::jsonb,
  tier       text not null check (tier in ('ground', 'decoy', 'orbit', 'moonshot', 'deep')),
  added_by   text,
  created_at timestamptz not null default now()
);
create index if not exists answer_additions_prompt_idx on answer_additions(prompt_id);

alter table missed_guesses enable row level security;
alter table answer_additions enable row level security;
