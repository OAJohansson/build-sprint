# Make for every layer: reading spike (L220), 27 Oct 2026

The phase's riskiest assumption is that separated parts other than the bass can be read well enough
to work with: drum hits labelled by type, and several notes at once in "other". This spike tested
it before any UI. These are the builder's own measurements on a synthetic bench. They are not a
grade: `data-evals` re-runs Z1–Z3, adds the hand check on 2 real tracks, and gives the verdict.

## What was built

| File | What it is |
| --- | --- |
| `apps/07-six-am/src/lib/make/drums-read.ts` | Drum reader: a looped drum part, BPM and loop start in; hits out (time, row, velocity), plus three step patterns (kick, clap/snare, hats) on the 16th grid with each hit's offset in ms, the grid phase and the swing |
| `apps/07-six-am/src/lib/make/notes-read.ts` | Note reader for the "other" part: notes out (start, length, MIDI, velocity, step and offset), several at once, plus the tuning offset |
| `apps/07-six-am/src/lib/make/dsp.ts` | FFT, Hann window, power spectrogram, windowed-sinc decimation |
| `apps/07-six-am/src/lib/make/layers-bench.ts` | Ground-truth bench in pure TS (runs in Node and Vitest): a drum kit (two flavours), additive pitched voices, bleed, and the Z1–Z3 scorers |
| `apps/07-six-am/evals/make-layers/spike.eval.ts` | Runs the bench and writes `spike-results.json` (`pnpm -F 07-six-am exec vitest run --config evals/make-layers/vitest.config.mts`) |
| `drums-read.test.ts`, `notes-read.test.ts` | Unit tests: a normal loop, a silent loop, an empty loop and a hats-only loop for each reader, plus swing for drums and one held pad for notes |

No new dependency and no ML model. Nothing writes audio: the readers take Float32Arrays and return
numbers, so rule C2 is unaffected. The bass flow is untouched and all 445 existing and new tests pass.

## Method

**Drums.** The reader builds a spectrogram (1024-point FFT, 2.9 ms hops, 17 log bands from 30 Hz to
16 kHz). Each column stacks three time slices (the attack, +15 ms and +50 ms), so a template also
knows how long its hit rings. It runs KL-NMF with five templates: kick, clap/snare and hats start
from prior shapes and then adapt, a held "tonal bleed" template and a flat one soak up everything
else. A drum template that drifts out of its row's frequency range is reset to its prior; that is
the semi-adaptive NMF used in drum transcription (Dittmar and Gärtner 2014; Wu et al. 2018 review).
Onsets are the peaks of each row's activation rise. Each onset is timed from the raw energy of the
row's own bands: the earliest strong local peak of the rise, so a clap's first burst counts, not
its tail. Gates then decide what is kept:
- size: above a floor in dB under the loop's biggest hit, set per row;
- sharpness: the activation must jump, and the row's raw band energy must jump too;
- clap flatness: a clap must be noise, not a chord's bleed;
- leak: a click under a kick, or snare noise under a hat, must stand 6 dB clear of the smallest
  leak seen between the two rows.

Quantising works like this: the grid phase is a circular mean of the hits against the 8th-note
period, and each hit keeps its offset from the grid. Swing is the median offset of the odd 16ths
minus that of the even ones.

**Notes.** The part is decimated to ~11 kHz. The reader takes a 186 ms spectrum every 11.6 ms and
picks its spectral peaks. Each peak is tried as a fundamental by summing its 8 harmonics. The
reader takes the best one, cancels its harmonics (down to a smooth envelope, so a shared harmonic
keeps the excess) and repeats, up to 6 notes per frame. This is Klapuri-style iterative estimation
and cancellation, much simplified. Bass bleed is read down to 40 Hz so its harmonics are cancelled,
then dropped under E2.

Each pitch's run of frames becomes a note. A pitch that comes back with no attack near it (a held
pad's beating) extends the note before it. A pitch that appears with no attack at all is treated
as a leftover harmonic and dropped. Starts are snapped to an attack curve: band-wise log-energy
flux minus a local median, with a 46 ms window to decide whether an attack is there and a 23 ms
window to time it. The key, when known, drops weak out-of-key pitches.

**Bench (ground truth).** All loops are 8 bars at 120–128 BPM and 44.1 kHz. Each loop is cut from a
longer render, so its first hits sit on the tails of the bar before. The drum loops add ±2 ms of
human jitter, and two of them start a few ms off the grid (the map's bar line is only an estimate).
- **Drum loops (6):** four-on-the-floor with offbeat open hats; four-on-the-floor with 16th hats and
  accents; swung 16ths (+25 ms) with a snare kit; broken beat with ghost snares at −10 dB; garage
  2-step swung by 18 ms; and a hats-only breakdown.
- **Pitched parts (6):** offbeat stabs (Am7 F C G); syncopated Chicago stabs (Fm7 Db Ab Eb, with
  octave doubling); held pads, one chord per 2 bars, voiced low (A2–G3); pads with a 150 ms attack;
  a pluck lead with overlapping notes over a pad; and organ chords.
- **Bleed:** each part is run clean, then with the other parts added at −25, −20 and −15 dB under
  the part's RMS, plus a −50 dB noise floor. Drum parts get an offbeat bass line and chord stabs.
  The "other" parts get a drum loop and the bass.

**Scoring.**
- **Z1:** distinct onset times, where found hits within 10 ms of each other merge into one event.
  A hit is on time if it lands within 10 ms of the truth. Extra = found events with no truth near
  them, divided by the number of truth events.
- **Z2:** at the on-time events, the row labels that agree, divided by all labels on either side.
  This is strict: a missed hat under a clap counts against it.
- **Z3:** truth chords are notes that start within 10 ms of each other. For each chord, the share of
  its pitch classes found among the notes read within 30 ms, averaged over chords. Wrong = notes
  read whose pitch class is in no chord within 30 ms, divided by all notes read.

## Results against the bars

Pooled over the 6 loops of each family (per-loop numbers are in `apps/07-six-am/evals/make-layers/spike-results.json`).

| Check | Bar | Clean | −25 dB bleed | −20 dB bleed | −15 dB bleed |
| --- | --- | --- | --- | --- | --- |
| Z1 hits found | ≥ 90 % | 99.2 % | 99.2 % | 99.3 % | 99.3 % |
| Z1 extra hits | ≤ 10 % | 0.7 % | 0.8 % | 1.1 % | 2.3 % (8.7 % on hats-only) |
| Z1 onset error | ≤ 10 ms | median 0.9–2.0, p95 ≤ 4.8 ms | p95 ≤ 4.8 | p95 ≤ 4.6 | p95 ≤ 5.4 |
| Z2 labels right | ≥ 85 % | 95.4 % | 94.8 % | 91.7 % | 90.8 % |
| Drum steps right (extra) | none | 94.9 % | 94.2 % | 90.5 % | 89.1 % |
| Z3 pitch classes per chord | ≥ 70 % | 91.1 % | 92.5 % | 92.1 % | 91.7 % |
| Z3 wrong notes | ≤ 20 % | 4.0 % | 8.5 % | 10.9 % | 18.3 % |
| Z3 onsets | ≤ 30 ms | p95 ≤ 8.7 ms (slow pads 22 ms) | p95 ≤ 8 (slow pads 20) | p95 ≤ 7.9 | p95 ≤ 8.8 |
| Time per 8-bar loop, drums | well under 1 s | 208–246 ms | 191–274 ms | 191–284 ms | 190–236 ms |
| Time per 8-bar loop, notes | well under 1 s | 111–165 ms | 132–183 ms | 119–159 ms | 122–162 ms |

Times are from Node 24 on a single thread on this Mac, for 15–16 s of 44.1 kHz audio, without the
separation itself. A browser worker should be in the same range. Both readers are pure TS, so they
can run in the existing Make worker.

**Per loop, under the bars:**
- **Z2 (drums):** hats-only with −15 dB bleed scores 70.9 %: with no real kick or clap, the bass and
  chord bleed is read as 32 kicks and 31 claps. Four-floor with open hats at −25 dB scores 80.6 %:
  11 extra claps from chord stabs whose bleed is still noisy enough. 16th hats at −20 dB scores
  82.4 %: 31 hats under kicks and claps are dropped as leak.
- **Z3 wrong (notes):**
  - Pluck lead over a pad: 18.5 % clean and 21–26 % with bleed. Held pad notes that drop out and come
    back at a lead attack are read as new notes.
  - Held pads with bleed: 19–46 %. Drum hits give leftover pad harmonics an "attack" to start on.
  - Slow-attack pads: 13 % clean, then 71–100 % with bleed. A 150 ms swell has no attack the reader
    can see, so with bleed the notes snap to drum hits instead.
- **Z3 found (notes):** Chicago stabs (84 %) and organ (81 %) are above the bar but lose some notes:
  octave doublings and close voicings are cancelled away with the lower note's harmonics.

## Real separation (htdemucs) on a synthetic mix: not run

The real separator, htdemucs on ONNX Runtime Web with WebGPU in a browser worker, was not run
headlessly in this spike. Running it in Node would mean the onnxruntime-web WASM backend with no
WebGPU, plus the 180 MB model downloaded outside the browser's cache. The Lab spike measured about
0.7 s per 7.8 s window on WebGPU; WASM in Node would be many times slower and is an untested path.
The fallback was used instead: parts with bleed injected at −25 to −15 dB.

Separation also smears transients and leaves "musical noise", which bleed injection doesn't model.
The Lab's bench measured drums at 34.6 dB SDR and other at 13.2 dB on Six AM's own loop, so
separated drums are cleaner than the −15 dB case here, and separated "other" is rougher. The next
check is the hand check on 2 real tracks in the browser.

## Weak spots

1. **Slow attacks (pads, swells).** The note reader needs an attack to start a note on. With bleed,
   a 150 ms swell snaps to drum hits or goes missing. Real house pads often swell.
2. **Held notes under moving notes** (pad under a lead). Dropouts get re-struck at the lead's attacks
   and are counted as wrong notes. The pitch classes are right; the extra notes are re-strikes.
3. **Breakdowns with no kick or clap.** Bleed fills the empty rows at −15 dB. The row gates are
   relative to the loop's biggest hit, which here is a hat.
4. **Hats under kicks and claps** are dropped when every kick or clap has a hat on it, because the
   leak estimate then sees the real hat as leak. For a copy of the pattern that means a missing hat
   on beats 1–4, which is audible on 16th-hat loops.
5. **Octave doublings and close low voicings** (A2 against C3) lose a note in chords. The pitch class
   usually survives.
6. **The thresholds were tuned on this bench** and are marked `// shortcut:` in the code. Real kits
   (909 rides, shakers, toms, percussion) have no row of their own. A shaker reads as hats and a tom
   probably as a kick or a clap.

## What I'd do if a bar fails on the real tracks

- **Z1 timing or recall:** shorten the band STFT (512 points) for timing only. Lower the activation
  rise threshold and lean on the raw-energy jump gate.
- **Z2 labels:** fold the loop to its 1/2/4-bar pattern (as `pattern.ts` does for bass) and label
  each step by majority over the repeats. One-off errors vanish and hats masked under kicks come
  back from the bars where they are clear. Also add a percussion row ("other hits") so toms and
  shakers stop polluting the three rows. A small learned model (for example an ADT CNN) is the step
  after that, and would be a learning decision.
- **Z3 wrong notes:** fold to the loop's period, then keep only notes present in most repeats.
  Merge same-pitch notes across short gaps whatever attack sits there, and fall back to the beat
  grid for onsets when no attack is near (slow swells).
- **Z3 found:** if chord tones stay under 70 % on real "other" parts (piano, layered synths), this
  is the point to consider Basic Pitch (Spotify, Apache-2.0, a small model with an ONNX export) in the
  worker. It is not needed on this evidence; that call is the PM's to log.
