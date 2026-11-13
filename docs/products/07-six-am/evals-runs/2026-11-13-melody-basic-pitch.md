# Melody with Basic Pitch: the time-boxed real-track grade, 13 Nov 2026 (data-evals)

This grade decides L245/L246: whether melody stays in the phase. The build is bf7164c
(Basic Pitch 1.0.1 on tfjs 3.21 in Make's worker, behind `MELODY_READER = "basic-pitch"`). I only
graded and changed no product code.

**Setup.** My own sandbox on :3017 (in-memory store, `test-code`), seeded with `sandbox-seed.mjs`
(no Mentor key, no AI calls), and my own Chrome with WebGL over CDP, with Deck auto-select. Every
loop was separated live.

**C2.** Numbers only (band envelopes and a semitone spectrogram of the copy that reaches
"melody-read"); deleted after grading.

**Labels.** The Z3 labels are the 12 Nov export, used as fixed times. Scoring is the spike's
`scoreNotes`, with ambiguous events accepted and not required (see `2026-11-12-melody-slice.md`).

## Part 1: the reader, Lost in the Loop

### BP-1 (blocker): Basic Pitch only reads once per worker

The first melody read in a worker logs `melody read (basic-pitch)`. **Every later read in the same
worker logs `melody read (dsp)`.** The worker's console has the reason:
`[make] Basic Pitch failed, reading with the DSP reader Error: Tensor is disposed`, from tfjs
`executeOp → getParamValue → dataSync`.
- In normal use (loop the drop, loop another section) only the first loop is read by Basic Pitch.
  The rest silently fall back to the DSP reader.
- Likely cause: `notes-bp.ts` wraps the first `evaluateModel` in `tf.engine().startScope()` /
  `endScope()`. Tensors the graph model creates lazily on its first run (constants and parameters)
  are made inside that scope and disposed with it.
- Repro: Make → Melody, loop Lost bars 69–76, then loop bars 77–84. The page console shows "(dsp)"
  for the second read; the worker console shows the warning above.

To grade Basic Pitch itself, I gave **every read a fresh page**:
1. Open Make → Drums and press Play.
2. Set the loop and wait until it is in memory.
3. Switch to Melody, so that loop is the melody worker's first read.

All "BP" rows below logged `(basic-pitch)`.

| Check | Bar | Measured (Basic Pitch, fresh worker) | Result |
| --- | --- | --- | --- |
| **Z3, Lost 69–76** (G7 stabs, 55 chords, 3 reads) | ≥ 70 % pitch classes found by onset; ≤ 20 % wrong; onsets ≤ 30 ms | **13.5 / 13.5 / 13.1 %** found (sounding 25.7–26.1 %), wrong 6.1–11.4 %, onset p95 24.4–24.6 ms (timing aligned, best shift 0 ms). Basic Pitch reads the stabs as a **one-note line**: 33–35 notes, 30 of them **G2**, plus 4 F5. Per pitch class: G 26/54, **D 0/54, B 0/53**, F 4/53. The DSP reader got 35–37 % on 13 Nov | **Fail** |
| **Z3, Lost 77–84** (14 chords, pad-like, 2 reads) | same | **61.3 / 57.7 %** found, wrong 22.5 / 25.0 %, onset p95 27–30 ms. C, A, F♯ and F never found | **Fail** |
| MR-1: Lost 69–76 not doubtful, 3+ reads | not doubtful | 3/3 not doubtful, but because it is now read as a **Lead row** (33–39 notes) with no Chords row | Pass, for the wrong reason |
| M-F4: same verdict over 2 reads | stable | Lost 69–76: 3/3 Lead, not doubtful. Lost 77–84: 2/2 Chords, 40 notes, not doubtful. Lost 21–28 and 49–56: doubtful ("no repeating pattern") | **Pass** |
| Held-pad-like loops | look only | Lost 77–84 (dyad pad): see Z3. Lost 21–28 and 49–56 are flagged doubtful and are off in Mine | Basic Pitch does no better on pads |
| Z5 A/B (LUFS) | within 1 dB | 30/30 cases with Mine sounding within 0.05 LU | Pass |
| Z6 Suggest | ≥ 3 of 5 loops | Product distance 5/5 rows; independent check 5/5 | Pass |
| Z12 incl. first model load | ≤ 35 s | HTTP cache cleared, cold open of Lost in Make → Melody, Play: knobs live **50.4 s** after the click (39.9 s after the parts play). The default loop is 16 bars (31.2 s); the first Basic Pitch read took **10.0 s** (model and tfjs load, first WebGL compile, dev server). Later fresh-worker reads: **1.5–2.8 s** from switching to Melody with the loop in memory | **Fail** (cold) |

### Observation: loop copies move by about 30 ms between runs

The same Lost 69–76 loop, cross-correlated between this run's reads, sits 29–32 ms apart. A
30 ms Z3 tolerance is sensitive to that; this run's Basic Pitch reads aligned at 0 ms.
