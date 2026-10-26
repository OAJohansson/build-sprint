-- Six AM AI loops (Phase 3, slice S4). ADDITIVE and idempotent: creates one table and one index,
-- never drops, deletes or rewrites anything. Paste into Supabase → SQL Editor → Run (same project
-- as sixam_tracks). Only the app's server talks to it with the secret key, so RLS is on with no
-- policies (decision 0020).
--
-- These are generated loops, made for the owner by Stable Audio or Lyria: the owner's own files,
-- not captured or streamed audio (Ears' C2 still holds: nothing captured is ever stored).
-- shortcut: audio as base64 text in the row (≤ 8 MB, about 20 s of 44.1 kHz stereo WAV); move to a
-- Supabase Storage bucket if loops get longer or there are more than a few hundred.

create table if not exists sixam_ai_loops (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stability', 'lyria')),
  model text not null check (char_length(model) between 1 and 80),
  prompt text not null check (char_length(prompt) <= 4000),
  bpm numeric(6, 2) not null check (bpm > 0 and bpm < 400),
  key text not null check (char_length(key) between 1 and 8),
  scale text not null check (scale in ('major', 'minor')),
  bars smallint not null check (bars between 1 and 64),
  seed bigint,
  mime text not null,
  -- Estimated from the provider's published price (Stable Audio 8 credits = $0.08 per draw; Lyria Clip $0.04).
  cost_usd numeric(10, 6) not null default 0,
  -- Seconds the provider took (wall clock), not the audio length.
  seconds numeric(8, 3) not null default 0,
  -- L126: the server checks each draw (tempo ±1 BPM, same or relative key) and draws again, up to
  -- 3. draws = paid draws (each counts towards the daily cap; cost_usd is their sum), checked =
  -- the kept one passed, measured = { bpm, key, scale, keyStrength, inKey, onTempo }.
  draws smallint not null default 1 check (draws between 1 and 3),
  checked boolean not null default false,
  measured jsonb,
  -- The Ears result it was made from (sixam_analyses.id, the SoundCloud URL), if any. No FK: a
  -- cleared analysis keeps its loops.
  analysis_id text check (analysis_id is null or char_length(analysis_id) <= 600),
  audio_b64 text not null check (char_length(audio_b64) <= 8000000),
  created_at timestamptz not null default now()
);
create index if not exists sixam_ai_loops_created_idx on sixam_ai_loops (created_at desc);

alter table sixam_ai_loops enable row level security;
