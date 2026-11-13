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

## Part 2: Mason riff, Z9, and the FX re-measures

| Check | Bar | Measured | Result |
| --- | --- | --- | --- |
| MR-2: Mason riff loops → one Lead row (BP, fresh worker) | one Lead row | **6/6** reads are one Lead row and no Chords: 17–24 (34, 37 notes), 41–48 (31, 30), 57–64 (38), 81–88 (38). The pitches fit my spectrogram reading of the riff: 17–24 has G4 ×19, F4 ×11; 41–48 has G4 ×21, F4 ×6, A♯4 ×3. Mason has no hand labels, so note accuracy isn't scored | **Pass** |
| M-F4 on Mason | stable over 2 reads | 17–24 and 41–48: Lead both times, never doubtful | **Pass** |
| Z9: 0 bytes of the original; model from our own origin | 0 | 6,578 requests. The Basic Pitch model (`/models/basic-pitch/model.json`, `group1-shard1of1.bin`), the `@spotify/basic-pitch` chunk and every tfjs chunk are **GETs from localhost:3017**; no third-party model host. Bodies go only to `PUT /api/maps` (seed) and SoundCloud's own widget telemetry. Longest numeric array 108. The worker zeroes the resampled copy and the part copy | **Pass** |
| FX-R1: impact verdict stable (Lost 73–80) | same verdict | **3/3** reads say "no clear hit". Riser and downlifter are "none" every time | **Pass** |
| FX-R3: FX A/B within 1 dB (Lost 73–80) | within 1 dB | Live, K-weighted, over one loop: A −8.05 vs B −9.10 (**−1.05 dB**) with the bed; A −10.92 vs B −11.91 (**−0.99 dB**) without. partsDb −2.53, as before the fix | **Fail** (borderline: 0.05 over with the bed) |

## Verdict for L245

| Eval | Bar | Basic Pitch (fresh worker) | DSP reader (13 Nov) |
| --- | --- | --- | --- |
| Z3 Lost 69–76 (G7 stabs) | ≥ 70 % found, ≤ 20 % wrong | 13.1–13.5 %, wrong 6–11 % | 35.3–36.9 %, wrong 1–4 % |
| Z3 Lost 77–84 | same | 57.7–61.3 %, wrong 22.5–25.0 % | 77.4–79.8 %, wrong 23.5–31.4 % |
| One-line riff → Lead (MR-2) | Lead | 6/6 | 0/6 |
| Doubtful verdict stable | same verdict | stable (3/3 and 2/2) | flips |
| Works on every read | yes | **no** (BP-1: first read per worker only) | yes |
| Cold time to knobs | ≤ 35 s | 50.4 s (16-bar default loop + 10 s first model load) | 21–38 s |

**Basic Pitch doesn't reach the Z3 bar on the one real chord loop.** It is worse than the DSP
reader there: it hears the G7 stab as a G2 line, and D and B are never found. It does fix the
one-line riff (MR-2) and the doubtful verdict's stability.

By L245's rule ("if Z3 still misses the bar, ship drums and FX and move melody to the next
phase"), **Z3 misses the bar with both readers**.

Even if Basic Pitch were kept for leads, BP-1 has to be fixed first: today it only reads the first
loop per page.

Cost: $0. Not checked:
- By ear.
- Pads beyond Lost 77–84 (no clean held-pad loop on these tracks).
- Lead-note accuracy on Mason (no labels; I judged plausibility only).

## 13 Nov, FX-R3 re-measure (after 12b82e9)

Same setup: my own sandbox on :3017 and Chrome. I measured the live output over one loop, the
same way as before: a K-weighted tap (high shelf +4 dB at 1.5 kHz, high-pass 38 Hz), ungated,
before the quiet master.

| Case | A (the drop as is) | B (Mine) | B − A | Bar |
| --- | --- | --- | --- | --- |
| Lost 73–80, drums under both on | −8.10 | −9.11 | **−1.01 dB** | within 1 dB |
| Lost 73–80, drums under both off | −10.96 | −11.92 | **−0.96 dB** | within 1 dB |
| Mason 69–76, bed on (control) | −14.37 | −14.29 | +0.08 dB | within 1 dB |
| Mason 69–76, bed off (control) | −17.39 | −17.37 | +0.02 dB | within 1 dB |

**FX-R3 is at the bar, not clearly inside it.**
- With the bed it is 0.01 dB over; without it, 0.04 dB under. Both are within the precision of my
  ungated meter.
- The fix barely moved the gain: partsDb is −2.50 (was −2.53).
- So the fix hasn't changed what plays on this loop: B is still about 1 dB quieter than A. Mason
  stays within 0.1 dB.
- I'd grade it borderline: a pass by the numbers without the bed, a 0.01 dB miss with it. The
  owner's A/B on this loop is the fair tie-break.

**Melody off (L247): pass.**
- The Melody tab shows "Melody comes next: Make will read the chords and the lead of the loop and
  play them with your own synth.", with "Make a bass instead".
- `__sixamLab.melody` is gone. No `[make] melody` console line, no "melody-read" message reached
  the worker (0 taps), and the dev log has no melody read.
- Minor: the Mentor panel on that tab says "Mentor, on Other" and "Ask about Other…" (T140 says
  "the melody").

**Drums Z5 spot check: pass.** On Mason 17–24, Mine − original is 0.00 LU at the home presets and
0.00 LU with Tight + Rim + Shaker.

Cost $0. Server and Chrome stopped afterwards.
