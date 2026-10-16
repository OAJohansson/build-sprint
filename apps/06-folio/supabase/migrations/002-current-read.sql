-- Folio: the Current read shelf (owner, 16 Oct). Run once in Supabase → SQL Editor → Run.
-- Safe to run twice.
alter table folio_books drop constraint if exists folio_books_shelf_check;
alter table folio_books add constraint folio_books_shelf_check check (shelf in ('reading', 'read', 'want'));
-- When I started the book I'm reading now (v2 builds on this: words and notes while reading).
alter table folio_books add column if not exists started_on date;
