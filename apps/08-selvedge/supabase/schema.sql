-- Selvedge schema. Paste into Supabase → SQL Editor → Run, in the shared project (decision 0021;
-- tables are prefixed per app). Only the app's server talks to these tables and the bucket, with
-- the secret key, so RLS is on with no policies and the bucket is private: the public key can't
-- read anything. Safe to run again.

-- One row per save: a picture (a screenshot, a photo, or the picture behind a shared link), or
-- a link whose picture couldn't be fetched (then I'm asked for a screenshot).
create table if not exists selvedge_saves (
  id uuid primary key,
  -- Path of the picture in the selvedge bucket; null when a link had no picture.
  image_path text,
  -- Width / height of the picture, so the tray and the board can lay it out before it loads.
  aspect real check (aspect is null or aspect > 0),
  -- The page that was shared (Instagram post, Pinterest pin), if any.
  link text check (link is null or char_length(link) <= 2000),
  -- Where it came from: instagram, pinterest, gallery, upload, web.
  source text not null default 'web' check (char_length(source) <= 20),
  title text check (title is null or char_length(title) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists selvedge_saves_created_idx on selvedge_saves (created_at desc);

-- One row per board ("Summer 2026"): its name and the whole arrangement as JSON.
create table if not exists selvedge_boards (
  -- Generated in the browser, so the first autosave can create the row.
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 80),
  -- { "pieces": [{ "id", "kind", "saveId", "x", "y", "w", "h", "z", "cropX", "cropY", "zoom", "rough", "color", "text" }] }
  doc jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists selvedge_boards_updated_idx on selvedge_boards (updated_at desc);

alter table selvedge_saves enable row level security;
alter table selvedge_boards enable row level security;

-- The private bucket for the pictures (shrunk in the browser first, so a few hundred KB each).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('selvedge', 'selvedge', false, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
