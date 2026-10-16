-- Folio schema. Paste into Supabase → SQL Editor → Run, in the same project as CrossFit Log and
-- Scribble (tables are prefixed per app; decision 0015). Only the app's server talks to these
-- tables (with the secret key), so RLS is on with no policies: the public key can't read anything.

-- One row per book on my shelves: what I think of it, plus enough book data to draw it without
-- calling the book services again.
create table if not exists folio_books (
  -- Generated on the device, so a save can upsert the same book again.
  id uuid primary key,
  -- Open Library work id ("/works/OL…W"): every edition of a book shares it, so a book can only
  -- be on my shelves once (the import's merge rule).
  work_key text unique,
  goodreads_id text unique,
  isbn13 text,
  title text not null,
  author text not null,
  cover_url text,
  published_year int,
  -- 'reading' is the Current read shelf (migration 002).
  shelf text not null constraint folio_books_shelf_check check (shelf in ('reading', 'read', 'want')),
  -- Half stars, 0.5 to 5; null means not rated.
  rating numeric(2, 1) check (rating is null or (rating between 0.5 and 5 and rating * 2 = floor(rating * 2))),
  -- The one-liner shown on the shelf, and the optional longer review behind a tap.
  line text,
  review text,
  genres text[] not null default '{}',
  read_on date,
  -- When I started the book on the Current read shelf.
  started_on date,
  -- True when read_on came from Goodreads' "date added" because "date read" was empty.
  read_on_estimated boolean not null default false,
  added_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists folio_books_shelf_idx on folio_books (shelf, read_on desc, added_on desc);

alter table folio_books enable row level security;
