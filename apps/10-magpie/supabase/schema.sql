-- Magpie schema, in the shared Supabase project (decision 0021; tables are prefixed per app).
-- Only the app's server talks to the table and the bucket, with the secret key, so RLS is on with
-- no policies and the bucket is private. Additive only; safe to run again (decision 0029).

-- One row per yum: something I tasted and loved.
create table if not exists magpie_yums (
  id uuid primary key,
  -- Whose book: 'owner' (the owner's access code) or 'sandbox' (graders, decision 0028 #10).
  library text not null default 'owner' check (library in ('owner', 'sandbox')),
  -- "yum no. 43": counted per library, never reused.
  number int not null check (number > 0),
  name text not null check (char_length(name) between 1 and 120),
  kind text not null check (kind in ('food', 'drink', 'dessert')),
  -- Drinks: wine, cocktail, beer, coffee-tea. Food: dishes. Desserts: none.
  sub_kind text check (sub_kind is null or char_length(sub_kind) <= 30),
  -- The restaurant, bar or spot, as typed.
  place text check (place is null or char_length(place) <= 120),
  city text check (city is null or char_length(city) <= 80),
  country text check (country is null or char_length(country) <= 80),
  hearts int not null check (hearts between 1 and 5),
  note text check (note is null or char_length(note) <= 1000),
  -- Paths in the magpie bucket. The photo is never replaced by the sticker.
  photo_path text,
  sticker_path text,
  -- none (no drawing asked), drawing, ready, failed.
  sticker_state text not null default 'none' check (sticker_state in ('none', 'drawing', 'ready', 'failed')),
  sticker_started_at timestamptz,
  -- Set once when saved; an edit never changes it.
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Removed from the book; kept so Undo can bring it back.
  removed_at timestamptz,
  unique (library, number)
);

create index if not exists magpie_yums_library_saved_idx on magpie_yums (library, saved_at desc);

alter table magpie_yums enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('magpie', 'magpie', false, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
