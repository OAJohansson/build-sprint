-- Wont v1.1 sync (L27, L29): one merged JSON document per space in the shared Supabase project.
-- Additive only. Applied 26 Oct as migration `wont_docs`; safe to re-run.
-- `space` is picked by the access code: 'owner' (ACCESS_CODE) or 'sandbox' (SANDBOX_ACCESS_CODE).
-- Only the app's server routes use it, with the secret key: RLS on, no policies.
create table if not exists public.wont_docs (
  space text primary key check (space in ('owner', 'sandbox')),
  doc jsonb not null,
  rev integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.wont_docs enable row level security;
