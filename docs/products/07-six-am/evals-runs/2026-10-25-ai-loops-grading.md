# AI loops bake-off: grading (S4, X4, X5)

Graded by data-evals on 25 Oct 2026 from the 15 files of the engineer's run (manifest
`ranAt` 2026-10-24T17:43Z; see `2026-10-25-ai-loops-bakeoff.md`). Everything here was measured
from the files. Nobody listened to them. No API calls, no money spent. The builder's write-up was
treated as claims to check.

**Bottom line: no variant passes X4.** Stable Audio 2.5 does best: tempo 5/5, the right tonic
5/5, but in major on 3 of the minor prompts. X5 passes for all three variants.

## Method

- **Decoding:** WAV (16-bit, 44.1 kHz stereo) parsed directly. Lyria MP3 decoded with headless
  Chrome's `decodeAudioData` at 44.1 kHz. Mono mix for everything below.
- **Tempo (primary):** the app's own Ears code (`melFrames` + `estimateBpm` from
  `src/lib/ears/features.ts` / `bpm.ts`, copied unchanged except for the import extension), on
  16 kHz mono made with a windowed-sinc resampler. Pass = within ±1 BPM of the request. Half or
  double counts as "half/double", which is not a pass. **Second opinion:** my own spectral-flux
  onset autocorrelation (100 fps, comb of 8 beat multiples, 0.05 BPM grid, no tempo prior). With
  no prior it picks the half tempo on most bass-only loops, which is expected without drums. The
  "near request" column is its best peak within ±3% of the requested tempo.
- **Key (primary for grading):** bass-range peak chroma (30–400 Hz, 16384-point frames, 2.7 Hz
  bins) correlated with Krumhansl–Kessler profiles. Pass = same key or relative major/minor.
  **The app's key code is reported too.** Its chroma starts at 100 Hz, so on bass-only material
  it sees mostly harmonics. It made three "a fifth away" errors (C for F, A# for D#, D for G):
  the 3rd harmonic of the root is the fifth. I chose the bass-range estimator *after* seeing that
  pattern. X4 is reported under both estimators, and neither flips a verdict.
- **Length:** file duration vs `bars × 4 × 60 / bpm`.
- **Loop point:** the file (or, for Lyria, the first phrase) wrapped from its end back to sample 0.
  *Level jump* = RMS of the last 20 ms vs the first 20 ms, in dB. *Click ratio* = |last sample − first
  sample| over the 99th-percentile sample-to-sample step. Above about 10 is a likely audible
  click; around 1 or below is clean.
- **Quality proxies (these are proxies, not quality):** peak dBFS; clipped samples (|x| ≥ 0.999);
  RMS; silence (% of 50 ms windows below −60 dBFS); leading silence before −40 dBFS; spectral
  flatness (0 = tonal, 1 = noise); energy share below 250 Hz (is it a bass loop?) and above
  4 kHz (traces of hats or percussion?). For Lyria, *phrase repeat* = correlation of the
  < 400 Hz spectrogram of phrase 1 with each later full phrase.
- Scripts: `<scratchpad>/grade/decode-server.mjs` (MP3 decode harness),
  `<scratchpad>/grade/analyse.ts` (all measurements; `node analyse.ts <bakeoff> <pcm>`), raw
  output in `<scratchpad>/grade/results.json`. They are not in the repo, and no audio is in the
  repo.

## Per file

Requested → measured. Tempo verdict uses the app's estimator. Key verdict uses the bass-range
estimator (the app's key in brackets).

| Variant | # | Requested | Tempo (app) | Tempo (own; near req) | Tempo | Key (bass) [app] | Key | Length (s) vs asked | Wrap: jump dB / click | Peak dBFS / clipped | <250 Hz | >4 kHz | Flatness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SA 2.5 | 1 | 120 A min 8b | 120.0 | 60.0; 120.0 | pass | A min [A min] | same ✅ | 16.00 / 16.00 | −13.2 / 3.1 | −2.1 / 0 | 98% | 0% | 0.000 |
| SA 2.5 | 2 | 124 F min 8b | 124.0 | 62.0; 124.0 | pass | F maj [C maj] | parallel ❌ | 15.00 / 15.48 | +1.7 / **30** | −3.2 / 0 | 99% | 0% | 0.003 |
| SA 2.5 | 3 | 126 C maj 4b | 126.0 | 126.0; 126.0 | pass | A min [A min] | relative ✅ | 7.00 / 7.62 | −3.2 / 7.3 | −2.3 / 0 | 99% | 0% | 0.002 |
| SA 2.5 | 4 | 128 D# min 8b | 128.1 | 64.0; 128.0 | pass | D# maj [A# maj] | parallel ❌ | 15.00 / 15.00 | +3.6 / **30** | −3.3 / 0 | 100% | 0% | 0.000 |
| SA 2.5 | 5 | 145 G min 8b | 146.0 | 72.5; 145.0 | pass | G maj [G maj] | parallel ❌ | 13.00 / 13.24 | −0.3 / **48** | −2.8 / 0 | 99% | 0% | 0.000 |
| Lyria 3 Clip | 1 | 120 A min 8b | 120.0 | 60.0; 120.0 | pass | C maj [C min] | relative ✅ | 30.77 / 16.00 | silent head / 3.1 | 0.0 / 5 | 97% | 0.4% | 0.001 |
| Lyria 3 Clip | 2 | 124 F min 8b | 124.0 | 62.0; 124.0 | pass | F min [F min] | same ✅ | 30.77 / 15.48 | silent head / 0.3 | 0.0 / 16 | 90% | 2.6% | 0.004 |
| Lyria 3 Clip | 3 | 126 C maj 4b | 126.0 | 63.0; 126.0 | pass | F min [D# maj] | fifth ❌ | 30.77 / 7.62 | silent head / 3.2 | −0.5 / 0 | 95% | 1.4% | 0.002 |
| Lyria 3 Clip | 4 | 128 D# min 8b | 128.1 | 128.0; 128.1 | pass | A min [A min] | other ❌ | 30.77 / 15.00 | silent head / 0.3 | −1.4 / 0 | 94% | 0.2% | 0.000 |
| Lyria 3 Clip | 5 | 145 G min 8b | 144.5 | 144.6; 144.6 | pass | E min [E min] | other ❌ | 30.77 / 13.24 | silent head / 0.3 | 0.0 / 46 | 88% | 3.2% | 0.001 |
| SA 3.0 | 1 | 120 A min 8b | 95.9 | 60.1; 120.0 | **fail** | A min [A min] | same ✅ | 16.00 / 16.00 | −3.1 / 2.7 | −1.9 / 0 | 99% | 0% | 0.026 |
| SA 3.0 | 2 | 124 F min 8b | 62.0 (alt 124) | 62.0; 124.0 | half ❌ | F min [F maj] | same ✅ | 15.00 / 15.48 | tail silent / 0.3 | −2.8 / 0 | 100% | 0% | 0.026 |
| SA 3.0 | 3 | 126 C maj 4b | 63.0 (alt 126) | 62.9; 126.0 | half ❌ | G min [A# maj] | fifth ❌ | 7.00 / 7.62 | silent head / 5.3 | 0.0 / 5 | 95% | 0% | 0.002 |
| SA 3.0 | 4 | 128 D# min 8b | 85.3 | 64.0; 128.0 | **fail** | D# maj [D# maj] | parallel ❌ | 15.00 / 15.00 | tail silent / 0.6 | −2.6 / 0 | 100% | 0% | 0.003 |
| SA 3.0 | 5 | 145 G min 8b | 72.5 (alt 145.1) | 72.5; 145.0 | half ❌ | G min [D min] | same ✅ | 13.00 / 13.24 | −2.0 / **35** | −3.2 / 0 | 100% | 0% | 0.003 |

Extra measurements:

- **Lyria phrase repeat** (correlation of phrase 1 with each later full phrase): #3 0.94 / 0.92 / 0.90
  (repeats), #4 0.74, #5 0.17 (does not repeat). #1 and #2 have only one full 8-bar phrase in
  30.77 s, so there was nothing to compare.
- **Leading silence:** Lyria about 50 ms on every file (85 ms on #4). This is MP3 decoder and
  encoder padding: a loop cut from sample 0 starts late and drifts off the grid. SA 3.0 #3: 240 ms.
  SA 2.5: 0–5 ms.
- **Silence share:** SA 3.0 13–25%, SA 2.5 0–18%, Lyria 0–11%. These are gaps between bass
  notes, not dropouts.
- **Loudness:** Lyria is normalised (RMS −14.3 dBFS on all 5) and peaks at 0 dBFS with a few
  clipped samples (5, 16, 46). Neither Stable Audio model clips, except SA 3.0 #3 (5 samples).
- **Mode evidence (bass chroma, share of the requested tonic's thirds):** on SA 2.5 #2/#4/#5 the
  root dominates (34–58% of the chroma) and the third barely appears, with the major third
  slightly ahead (m3 vs M3: 2 vs 4, 5 vs 6, 1 vs 6). The lines are root–fifth with a major-leaning
  third, so "parallel" is a real result and not noise. Lyria's chroma fits the requested scale
  only 50–69% (Stable Audio 72–92%): its basslines wander outside the key.

## Per variant

| Variant | Tempo ±1 (app) | Key same/relative (bass) [app] | **X4** (both) | Tonic right incl. parallel (info) | Length on the bar grid | Wrap clicks (>10) | Clipping | Median time | Cost shown | **X5** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Stable Audio 2.5 | **5/5** | 2/5 [2/5] | **2/5 FAIL** [2/5] | 5/5 | 2/5 (others 0.24–0.62 s short) | 3/5 | none | 3.49 s | $0.08 | **PASS** |
| Lyria 3 Clip | **5/5** | 2/5 [1/5] | **2/5 FAIL** [1/5] | 2/5 | 0/5 as delivered (30 s; must be cut, 50 ms offset) | 0/5 at the phrase cut | 3/5 files | 13.23 s | $0.04 | **PASS** (published price only) |
| Stable Audio 3.0 | **0/5** (3 half, 2 off) | 3/5 [1/5] | **0/5 FAIL** [0/5] | 4/5 | 2/5 | 1/5 | 1 file | 3.30 s | $0.08 | **PASS** |

X4 bar: key matches (or relative) and tempo within ±1 BPM on ≥ 4 of 5. Not moved.

### X5 evidence

- **Stability (both models):** shown $0.08 per loop. The published price is 8 credits per
  successful generation for both 2.5 and 3.0, at 1 credit = $0.01 (docs.stability.ai/pricing,
  re-read 25 Oct). The manifest balance went 517 → 445 = 72 credits for 10 loops, read
  immediately. That is 9 × 8: the read lagged one charge, as the builder says. The builder's
  later reading of 437 (80 = 10 × 8) is **not in the manifest**. I couldn't verify it without a
  key, but 72 ≡ 9 × 8 is consistent with exactly 8 credits per loop. Within a cent: **pass**.
- **Lyria:** shown $0.04. The published price is "$0.04 per song" for Lyria 3 Clip Preview
  (ai.google.dev pricing, re-read 25 Oct). The response's `usage` only has tokens (72 in,
  315–348 out), and there is no balance API, so this matches the price list, not a bill. **Pass
  on the published price.** Check it against the Google Cloud billing report when it updates.

## Worst failures and likely causes

1. **Stable Audio returns whole seconds.** All 10 SA files are `floor(requested seconds)`
   (15.484 → 15, 7.619 → 7, 13.241 → 13). The adapter sends the exact fractional `duration`.
   3 of 5 loops therefore come out 0.6–1.3 beats short and can't loop on the bar grid. Likely
   fix (the engineer's call): ask for `ceil(seconds)` and trim to the exact phrase length on the
   server.
2. **Clicks at the wrap point:** SA 2.5 #2/#4/#5 (ratio 30–48) and SA 3.0 #5 (35). Part of this
   is cause 1, because the file ends mid-note. A short fade or crossfade at the seam after
   trimming is the usual fix.
3. **Major instead of minor (SA 2.5 #2, #4, #5):** the right tonic, but the line uses the major
   third. The prompt says "in F minor". Prompt wording like naming the scale notes, or "minor
   third", is worth an A/B, but that is a prompt change, not mine to make.
4. **SA 3.0 is not on tempo.** 3 of 5 come out at half time (its own best peak is the half
   tempo, and the requested tempo is only the alternative), and 2 of 5 are off entirely
   (95.9 for 120, 85.3 for 128).
5. **Lyria is off-key** (#4 A minor for D# minor, #5 E minor for G minor; 50–69% in-scale). It
   is also always 30 s, starts about 50 ms late after decoding, and its phrase only really
   repeats in 1 of 3 checkable files.

Side finding for Ears (not this slice): the app's key estimator (100–2000 Hz chroma) made
"fifth" errors on 3 of 15 bass-only files. On bass-heavy material its harmonics read as the
dominant. This is already marked as a `shortcut:`.

## Recommendation (on this evidence)

- **Winner: Stable Audio 2.5**, conditionally. It has the only perfect tempo record (5/5, and
  the own estimator agrees at the requested peak each time), the right tonic on 5/5, no
  clipping, the fastest generation (3.5 s), a seed that makes runs repeatable, and a verified
  cost. Its X4 failures come from two engineering causes (whole-second duration; seams) and one
  prompt cause (mode). The first two are fixable without changing provider. **Re-run X4 after the
  trim/seam fix and a mode-wording A/B.** On "tonic right" it would already be 5/5. On the
  strict bar it stays 2/5 until the minor third comes through.
- **Lyria 3 Clip as a fallback:** worth keeping only as an off-by-default switch, because the
  adapter exists and costs nothing to keep. Don't make it the default. It is half the price and
  on tempo 5/5, but key is 2/5 with the lowest in-scale share, it takes 4× longer, its length is
  fixed at 30 s (it needs cutting and a 50 ms offset fix), it peaks at 0 dBFS with clipped
  samples, and it has slightly more high-frequency content (0.2–3.2% above 4 kHz, which may be
  percussion despite "no drums"; a proxy only).
- **Stable Audio 3.0: drop.** Same price as 2.5, tempo 0/5.

## Not checked

- Musical quality, groove and "like this track" are taste calls for the owner's review. The
  proxies above only say "tonal, bass-dominant, mostly unclipped".
- n = 5 per variant, one seed (Stability) or one draw (Lyria): the variance between runs isn't
  measured.
- The Stability balance reading of 437 and Lyria's actual bill (no key or billing access used).
- Whether the app's displayed cost matches these, since the UI wasn't graded. X5 used the
  adapters' `costUsd` as recorded in the manifest.

## Re-grade, 25 Oct 2026: fix-pass re-run (Stable Audio 2.5 only)

The files are in `<scratchpad>/bakeoff-2/` (manifest `ranAt` 2026-10-24T17:58Z): 10 loops, the same
5 requests, seeds 42 and 7. The builder claims three changes: the loop is trimmed to the exact bar
length, the seam is crossfaded, and the key wording is new ("a dark natural-minor bassline rooted
on F, using only the notes F G G# A# C C# D# (minor third G#, no major third)"). The method,
scripts and bars are the same as above (scratchpad `grade/analyse.ts`, raw output in
`grade/results-run2.json`).

**Bottom line: X4 still fails.** Seed 42 got 3/5, seed 7 got 1/5, and the pooled result is 4/10
(40%; the bar is 80%). Length and seams are now fixed: 10/10 exact, 0/10 clicks. X5 passes.

### Per file

Tempo uses the app's estimator. Key uses the bass-range estimator (the app's key in brackets).
m3/M3 is the share of bass chroma on the requested tonic's minor and major third.

| File | Requested | Tempo (app; alt) | Tempo | Key (bass) [app] | Key | m3 / M3 | In scale | Length error | Wrap: jump dB / click | X4 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-s42 | 120 A min | 120.0 | pass | A min [A min] | same | 6 / 3 | 78% | 0 ms | −1.4 / 0.0 | ✅ |
| 01-s7 | 120 A min | 120.0 | pass | A maj [A maj] | parallel | 4 / 3 | 79% | 0 ms | −0.5 / 0.0 | ❌ |
| 02-s42 | 124 F min | 124.0 | pass | C maj [A min] | fifth | 5 / 11 | 56% | 0 ms | +6.6 / 0.3 | ❌ |
| 02-s7 | 124 F min | 82.7 (alt 124, 3:2) | fail | F min [G# maj] | same | 16 / 5 | 75% | 0 ms | +8.7 / 0.2 | ❌ |
| 03-s42 | 126 C maj | 126.0 | pass | C maj [G maj] | same | 2 / 6 | 85% | 0 ms | +3.4 / 0.9 | ✅ |
| 03-s7 | 126 C maj | 125.9 | pass | C maj [A min] | same | 2 / 10 | 91% | 0 ms | +1.4 / 0.3 | ✅ |
| 04-s42 | 128 D# min | 128.2 | pass | D# min [D# maj] | same | 8 / 6 | 84% | 0 ms | +6.9 / 0.1 | ✅ |
| 04-s7 | 128 D# min | 85.3 (alt 128.1, 3:2) | fail | G# maj [G# maj] | fifth (below) | 14 / 4 | 83% | 0 ms | **+19.5** / 0.0 | ❌ |
| 05-s42 | 145 G min | 72.5 (alt 145.2) | half | G min [D min] | same | 20 / 3 | 91% | 0 ms | +5.6 / 1.7 | ❌ |
| 05-s7 | 145 G min | 145.1 | pass | C# maj [C# maj] | other | 7 / 3 | 55% | 0 ms | +5.9 / 0.1 | ❌ |

("Fifth" means a fifth above or below, as in run 1. C# major for G minor is a tritone away, so it
counts as "other".)

### Summary

| | Tempo ±1 | Key same/relative (bass) [app] | **X4** (bass) [app] | Length on the grid | Wrap clicks (>10) | Clipped samples |
| --- | --- | --- | --- | --- | --- | --- |
| Run 1, seed 42 (old wording) | 5/5 | 2/5 [2/5] | 2/5 [2/5] | 2/5 | 3/5 | 0 |
| **Seed 42 (fix pass)** | 4/5 | 4/5 [1/5] | **3/5 FAIL** [1/5] | **5/5** | **0/5** | 0 |
| **Seed 7 (fix pass)** | 3/5 | 2/5 [1/5] | **1/5 FAIL** [1/5] | **5/5** | **0/5** | 0 |
| **Pooled (10)** | 7/10 | 6/10 [2/10] | **4/10 = 40% FAIL** [2/10] (bar ≥ 80%) | 10/10 | 0/10 | 0 |

- **Length:** all 10 are exactly `bars × 240 / bpm` (0 ms error), and none has leading silence.
  **Fixed.**
- **Seams:** the click ratio is at most 1.7 on all 10 (run 1 had 30–48 on three files).
  **Fixed.** The level step from the last 20 ms to the first 20 ms is still +1 to +9 dB on most
  files, which is likely a new note's attack starting at the downbeat. The exception is 04-s7 at
  **+19.5 dB**: the end is much louder than the start, so expect an audible drop at the loop
  point. That one is worth a listen in the owner's review.
- **Tempo got worse on new draws.** There are two 3:2 misreads (02-s7, 04-s7: the requested tempo
  is only the estimator's alternative) and one half-time read (05-s42). Run 1 had 5/5. The
  estimator might just have trouble with these lines, but my own estimator also has its best
  peak at the half tempo on 02-s7 and 04-s7. Two draws per prompt is too few to tell model
  variance from estimator variance.

### A/B: did the wording fix the mode?

This is not a clean A/B. Seed 42 is the same, but the requested `duration` also changed (whole
seconds rounded up, then trimmed), so the model drew a different generation. Read it as "new
wording + new draw".

- **Minor third over major third on the four minor prompts:** run 1 got 1/4 (#1 only). The fix
  pass got 3/4 on seed 42 and 4/4 on seed 7, so **7/8 pooled**. The major prompt (#3) has M3 > m3
  on both seeds and is now estimated as C major, where run 1 read A minor. **On mode, the wording
  works.**
- **The cost is a wandering tonal centre.** 3 of 10 now land on a different root: 02-s42 (C major,
  only 56% in scale), 04-s7 (G# major) and 05-s7 (C# major, 55% in scale). In run 1, 5/5 had the
  right tonic (including the parallel ones). The longer note list in the prompt may pull the
  bassline off its root, but n is small.
- Key on seed 42 went from 2/5 to 4/5. Seed 7 got 2/5.

### X5

- **Shown cost:** $0.08 per loop.
- **Balance:** 429 → 349 = **80 credits for 10 loops = exactly 8 credits ($0.08) per loop**,
  matching the published price. **PASS.**
- **8 credits not in either manifest:** the builder's post-run-1 reading was 437 and this run
  starts at 429. That is one generation (probably a probe) that isn't recorded in either
  manifest. Worth a line in the journal.
- **Speed:** median 2.90 s.

### Recommendation after the re-grade

- **Stable Audio 2.5 is still the best variant, but it doesn't meet X4** (40% vs 80%). The
  engineering fixes are confirmed (length and seams 10/10), and the wording fixed the mode (7/8).
- What now fails is draw-to-draw variance in tempo feel and in the tonal centre, so prompt
  tweaks alone are unlikely to reach 80%. Options for the PM (not my call):
  - (a) Generate 2–3 candidates per request and auto-pick the one that passes the app's own
    tempo and key check before showing it. That costs $0.16–0.24 per loop and needs a check
    that uses bass-range chroma; the app's current key code read 2/10 correctly here.
  - (b) Accept that A9 is "close" and say so in the UI: show the measured tempo and key next to
    each loop.
  - (c) Move the bar. That is the owner's decision, not mine.
- **Not checked:** listening or taste; more seeds; the repo copy at
  `apps/07-six-am/evals/ai-loops/analyse.ts`. It still imports `./ears/features.ts`, which
  doesn't exist next to it. I used the scratchpad copy and didn't edit the repo one.

## Checked draws, 25 Oct 2026 (Stable Audio 2.5, up to 3 draws per loop)

Files are in `<scratchpad>/bakeoff-3/` (manifest `ranAt` 2026-10-24T18:09Z). The route's
`drawLoop` keeps the first draw that passes its own check (Ears tempo ±1, bass-range key
same/relative), with at most 3 draws. That leaves 5 kept loops from 8 draws. Loops 01, 03, 04 and
05 are byte-identical to the re-grade's seed-42 files. Only 02 is a new draw (seed 1358171928).
Raw output is in `grade/results-run3.json`. The beat-grid check is in `grade/grid.ts`.

**Bottom line: X4 = 4/5 PASS (bar ≥ 4/5) and X5 PASS. Read the independence caveat below before
counting the X4 pass.**

| # | Requested | Ears tempo (alt) | Own ACF: best; peak near request; score there / best | Tempo | Key (bass) [app] | Key | Length error | Wrap: jump dB / click | Draws (shown cost) | X4 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | 120 A min | 120.0 (60) | 60.0; 120.0; 0.86 | pass | A min [A min] | same | 0 ms | −1.4 / 0.0 | 1 ($0.08) | ✅ |
| 02 | 124 F min | 124.0 (62) | 62.0; 124.0; 0.96 | pass | F min [C min] | same | 0 ms | −28.5 / 0.0 | 2 ($0.16) | ✅ |
| 03 | 126 C maj | 126.0 (63) | 126.0; 126.0; 1.00 | pass | C maj [G maj] | same | 0 ms | +3.4 / 0.9 | 1 ($0.08) | ✅ |
| 04 | 128 D# min | 128.2 (64.1) | 64.0; 128.0; 0.97 | pass | D# min [D# maj] | same | 0 ms | +6.9 / 0.1 | 1 ($0.08) | ✅ |
| 05 | 145 G min | **72.5** (145.2, ratio 0.77) | 72.5; 145.0; 0.97 | half ❌ | G min [D min] | same | 0 ms | +5.6 / 1.7 | 3, check failed, seed-42 draw kept ($0.24) | ❌ |

- **Tempo, Ears vs my own estimator.** The two estimators never disagree on where the
  periodicity is. Both find a peak within ±1 BPM of the request on 5/5 loops, and both see the
  half tempo as about equally strong (0.86–1.00) on 4/5. My own estimator has no tempo prior, so
  it can't settle half vs double: it picks the half tempo on 4/5, including 01, 02 and 04, which
  Ears passes. Only the Ears prior, a log-normal centred on 128 BPM, breaks those ties. So Ears is
  the deciding vote on the octave, and nothing independent backs it up.
- **#5 (is it really half time?)**
  - It looks like an estimator limit, not a 72.5 BPM loop.
  - On my comb (8 beat multiples), 145 scores 0.97 of the 72.5 score, the same picture as the
    loops Ears passes.
  - Ears' own score (4 multiples) only gives 145 about 0.56 of the raw 72.5 score. The prior
    (0.984 at 145 vs 0.714 at 72.5) then can't close the gap. The likely reason is a riff that
    repeats every 2 beats (the line's odd beats are slightly weaker: 0.81 vs 1.07 of a random
    position on the beat grid). Loop 03, which passes, shows a stronger version of the same thing
    (0.37 vs 0.79).
  - The loop is exactly 8 bars at 145 (13.241 s), so it sits on the 145 grid in the Studio either
    way.
  - By the rule, half time is still not a pass, so #5 fails. X4 passes without it.
- **Independence caveat (matters for X4).**
  - The loops were *selected* by the same two measures I grade with: Ears tempo and bass-range
    key. A pass on the kept loops is therefore partly circular. It shows that the selection
    works, not that a single draw is in key and on tempo.
  - The independent signals: my own tempo estimator confirms the requested periodicity on 5/5,
    with the octave unresolved. The app's 100–2000 Hz key code agrees on only 1/5 (C min, G maj,
    D# maj and D min on the others: the fifth or parallel errors on bass-only material described
    above).
  - Per draw, 4 of 8 draws passed the product's check.
- **Length and seams:** 0 ms length error on all 5, click ratio ≤ 1.7, no clipping, no leading
  silence. On 02 the end is 28.5 dB quieter than the start: the line decays before the loop point,
  and there is no click.
- **X5:**
  - Shown costs sum to 0.08 + 0.16 + 0.08 + 0.08 + 0.24 = **$0.64**.
  - The balance went 349 → 285 = **64 credits = 8 draws × 8 credits = $0.64**. Exact. **PASS.**
  - Cost per kept loop is now $0.08–0.24 (mean $0.128).
  - #5 cost $0.24 and was delivered *unchecked* (`checked: false`). Whether the UI says so wasn't
    graded.
- **Verdict:** Stable Audio 2.5 with checked draws meets X4 (4/5) and X5. Count it as a PASS
  under that caveat. For #5-style cases, the check, not the model, is the weak point at
  140+ BPM: Ears halves a riff that repeats every 2 beats. That is the engineer's call (for
  example, accept the requested tempo when it is Ears' named 2:1 alternative with ratio ≥ 0.75).
- **Not checked:** listening or taste; more prompts or seeds (n = 5); the UI's cost and
  "unchecked" display.
