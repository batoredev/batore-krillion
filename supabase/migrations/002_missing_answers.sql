-- Kribatov: missing-answer review (run once in the Supabase SQL Editor).
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
