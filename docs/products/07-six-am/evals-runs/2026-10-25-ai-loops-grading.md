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
