# Melody slice evals (Phase 5, slice 2), 12 Nov 2026 (data-evals)

These grades are for the melody/chords checks in `evals.md` (Phase 5: Z3–Z9, Z12) and the melody
parts of P4 and P6–P9, plus two drums re-checks (D-R1, N1). I only graded. I changed no product
code. The build is 8c25327 on `claude/07-six-am-make-layers-1ed1b6`, plus the drums re-check
fixes in ed9b3e1.

**Setup.** As in `evals-runs/README.md`: my own sandbox on :3017 (in-memory store, `test-code`),
seeded with `evals/sandbox-seed.mjs`, and my own Chrome over CDP with Deck auto-select and
`?quiet=1`. The Lab separated every loop live in the browser.

## Part 1: drums re-checks

**D-R1, flammed claps on Lost 21–28: not fixed.**
- Same hand labels as before, timed at the 1–3 kHz attack on this run's separation.
- The reader's claps sit −3 to +11 ms from the labelled clap attack. 12 of the 15 claps it read are
  within 10 ms; 3 are at 11 ms, and 4 more at 9–10 ms.
- The loop reads 86.5 % found, 0 % extra and 83.3 % labels (was 85.3 / 1.3 / 81.2), with one clap
  missing (15 read of 16).
- Lost 85–92 on the same run: 97.5 / 3.8 / 96.8; pooled over the two loops 92.2 / 1.9 / 90.5.
- The pooled Z1/Z2 bars still pass. Only the flam loop is under.
- Repro: Lost in the Loop, Make → Drums, `__sixamLab.setLoop(40551, 56159)`. Compare
  `drums().rows.clap.hits.map(h => h.t)` with the clap's first 1–3 kHz burst, which comes 10–13 ms
  before the kick.

**N1, header with the Mason title: pass.** At 1440 × 900 and 1280 × 800:
- The page width equals the window (no horizontal scroll).
- The title ellipsises (`text-overflow: ellipsis`, clipped at x 511 and x 415).
- No two header controls overlap; the rightmost control ends at x 1416 and x 1256.
