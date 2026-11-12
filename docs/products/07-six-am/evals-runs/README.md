# Evals runs: shared sandbox setup

Every data-evals run and user test of Six AM uses the same sandbox, so results compare.

1. Start the sandbox (in-memory store, never the owner's data):
   `SUPABASE_URL= SUPABASE_SECRET_KEY= ACCESS_CODE=test-code pnpm -F 07-six-am exec next dev -p 3017`
   (or the `07-six-am-test` launch config).
2. Seed the two eval tracks' maps: `node apps/07-six-am/evals/sandbox-seed.mjs`.
   It PUTs the Mason Flint remix (126.05 BPM, origin 0.11 s, G minor, 108 bars) and Lost in the Loop
   (123.02 BPM, origin 1.407 s, G major, 101 bars) and prints a link to each in Make → Drums. It
   refuses to write unless the server reports the in-memory store.
3. Unlock with the access code `test-code`.

Tempo, bar origin, key and bars are the measured values the evals used, so `setLoop` positions match
earlier runs. The section bounds are approximations that hold every eval loop in the section the
write-ups name; the real maps' bounds were not kept in the repo. To use the real ones, export the two
maps once (numbers only) and run `node apps/07-six-am/evals/sandbox-seed.mjs --maps maps.json`.
