-- CrossFit Log schema. Paste into Supabase → SQL Editor → Run.
-- Only the app's server talks to these tables (with the secret key), so RLS is
-- on with no policies: the public/anon key can't read or write anything.

create table if not exists crossfit_sessions (
  id uuid primary key,
  date date not null,
  title text not null default 'Session',
  transcript text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists crossfit_entries (
  id uuid primary key,
  session_id uuid not null references crossfit_sessions (id) on delete cascade,
  position int not null default 0,
  movement text not null,
  sets int,
  reps int,
  weight numeric,
  unit text not null default 'kg' check (unit in ('kg', 'lb')),
  score text,
  rx boolean,
  note text
);

create table if not exists crossfit_pbs (
  id uuid primary key,
  movement text not null,
  kind text not null check (kind in ('load', 'reps', 'time', 'rounds')),
  rep_max int,
  value numeric not null,
  unit text check (unit in ('kg', 'lb')),
  rx boolean,
  achieved_on date not null,
  -- A PB set in a session goes away if that session is deleted.
  session_id uuid references crossfit_sessions (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists crossfit_entries_session_idx on crossfit_entries (session_id);
create index if not exists crossfit_pbs_movement_idx on crossfit_pbs (movement);

alter table crossfit_sessions enable row level security;
alter table crossfit_entries enable row level security;
alter table crossfit_pbs enable row level security;
