# Phase 7 slice 1, "more starting sounds": data-evals, 27 Nov 2026

This run grades W1, W2, W3, W4, W11, W12 and W13 (`evals.md`, "Rebuild the song (Phase 7)") on
code at bb7bea0. HEAD later moved to 122e2d1, which changed docs only. I graded and changed no
product code.

**Result.**
- **Pass:** W1, W2, W3, W11, W12, W13.
- **Fail:** W4.
  - The sampled drum knobs come close: 118 of 120 checks pass.
  - Four of the eight bass knobs miss the bar on most presets: Drive, Sub, Weight and Wobble.

## Scope: which rows are wired in slice 1

- **Shipped:** all 120 kit files (6 drum rows × 20) and the 10 bass recordings. W1–W3 cover the
  whole kit.
- **Wired in Make:**
  - Three shelves: Kick, Claps & snares and Closed hat (`KIT_ROW_FOR`: kick → kick, clap → clap,
    hats → hat).
  - The 20 bass presets.
- **Shipped but on no Make shelf yet:** the Open hat, Shaker / percussion and Ride sounds.
  `KIT_TO_ROW` maps them to Hats until slice 2.
- **How W4 covers them:** it grades the knob render code (`kit-drum.ts`), which every row shares.
  So it covers all six rows, but the real check for the slice 2 rows comes when they are wired.

## Setup

- **Render checks (W2, W4)** ran in Node through the app's own code: `renderKitHits`,
  `renderBass` and `synthParams`.
  - Files: the shipped files, decoded with macOS `afconvert` to float WAV.
  - Loading: mono, with `trimLead(−60 dB)`, as `kit-load.ts` does.
  - Scripts and decoded files are in the session scratchpad (`ev/`), not committed.
- **Feature definitions** (written before scoring):
  - **Brightness:** spectral centroid. 2048-point Hann frames, hop 512, with magnitudes summed
    from the onset to the −20 dB point.
  - **Length:** the −20 dB decay. From the onset (first sample within 40 dB of the peak) to the
    end of the last 10 ms RMS window within 20 dB of the loudest, at a 1 ms hop.
  - **Near-duplicate:** max/min ≤ 1.10 on both features.
  - **Bass render for W2:** one C2 note, a 1/4-note gate at 124 BPM, default knobs (L273).
- **Browser checks (W11 part 3, W12, W13):**
  - Server: the sandbox dev server on :3027 (`ACCESS_CODE=test-code`, in-memory store, empty
    Supabase and AI keys), seeded with `sandbox-seed.mjs --base http://localhost:3027`.
  - Browser: my own Chrome 158 profile over CDP, with `--auto-select-tab-capture-source-by-title="Six AM Deck"` and `?quiet=1`.
    Every loop was separated live from the Deck.
  - Network: a logger on every page, popup and worker for the whole session.
  - Tracks: Lost in the Loop and the Mason Flint remix.
- **C2:** only numbers were kept. The grader Chrome profile, including its HTTP cache, was deleted
  after the run.
- **Sandbox writes:**
  - One old-style saved hats sound, via `POST /api/sounds` with `x-access-code: test-code`.
  - Two saved drum rows from Make.
  - All three went to the in-memory store only.

## Results

| Eval | Bar | Measured | Result |
| --- | --- | --- | --- |
| **W1** 20 starting sounds per row, each with family, feel word, one line | 7 × 20; every family in the variety map has ≥ 1 | Kick, Claps & snares, Closed hat, Open hat, Shaker / percussion and Ride: **20 each**, ids unique. Every family is one of the map's, every feel is one word, every line is one non-empty line, every file exists. **Every map family is covered:** kick 9/9, claps 10/10, closed hat 7/7, open hat 6/6, perc 7/7, ride 5/5. Bass: **20 presets**, all 13 map families covered (3 sampled). Ride's "909 ride" family is four stand-ins, as logged (L275) | **Pass** |
| **W2** no near-duplicates; each row spans ≥ 3× | no pair within 10 % on both features; span ≥ 3× in brightness and length | **0 near pairs in all 7 rows.** Closest pair per row (larger of the two ratios): kick 1.16, claps 1.23, closed hat 1.15, open hat 1.17, perc 1.19, ride 1.14, bass 1.16. **Brightness span:** kick 35.7×, claps 6.1×, closed hat 11.5×, open hat **3.15×**, perc 57×, ride 3.59×, bass 23.7×. **Length span:** kick 12.7×, claps 16.7×, closed hat 19.9×, open hat 17.7×, perc 18.5×, ride 27.4×, bass **3.15×** (fixed render). My measurements agree with the values stored in `kit-p7.ts` within 7.8 % on every drum sound | **Pass** (open hat brightness and bass length are just above 3×) |
| **W3** licences | 100 % CC0 / CC BY with source, author, licence; CC BY credited in app; 0 unknown | **138 files on disk** under `public/kits`: 120 Phase 7 drums, 10 bass recordings, and 8 files in the old 909 and 808 kits. **138 rows in `LICENSES.md`**, 0 files missing, 0 extra rows. Every row has a source, an author and a licence: **128 CC0 1.0, 10 CC BY 3.0**. The 120 `kit-p7.ts` sources match `LICENSES.md` on page, author and licence. **Live check:** all 120 distinct Freesound pages returned 200, and each shows exactly one licence, CC0 (`publicdomain/zero/1.0`). tonejs-instruments' README: "Samples: CC-by 3.0". **In-app credit:** "Sound credits" sits in Make's drum and bass shelves (`sound-credits.tsx`). It names Nicholas Brosowsky and tonejs-instruments, links CC BY 3.0, says the files were changed, and links `/kits/LICENSES.md` | **Pass** |
| **W4** each knob, end to end, moves its feature | brightness ≥ 2×, length ≥ 2×, level ≥ 6 dB, pitch ≥ 5 st, on 5 sounds per row | **Sampled drums**, 5 per row picked by brightness rank (0, 5, 10, 15, 19), 30 sounds × 4 knobs: **Pitch 30/30** (24.0 st, time-domain fit r = 1.00), **Tone 30/30** (≥ 3.6×), **Length 29/30**, **Drive 29/30**. All 120 sounds: Pitch 120/120, Tone 120/120, Length 118/120, Drive 118/120 (level over the same window). **Bass**, 5 presets (rubber-pluck, sine-sub, organ-house, fm-glass, upright), a C2 note held a bar: Tone 5/5, Length 5/5, Pitch drop 5/5, Width 5/5; **Drive 2/5** (level; 4/5 on brightness), **Sub 1/5**, **Weight 2/5**, **Wobble 0/5**. All 20 presets: Tone 19/20, Length 20/20, Pitch drop 13/20, Width 20/20, Drive 5/20, Sub 7/20, Weight 5/20, Wobble 4/20 | **Fail** (drums 118/120; bass 4 of 8 knobs miss) |
| **W11** old sounds unchanged | 100 % sample for sample; old 3-row drum sounds open with Hats as Closed hat; suite green | **Suite:** `pnpm -F 07-six-am test`, **618/618 green** (61 files). The `bass-golden` hashes are unchanged since Phase 5 (the test now loops over `PHASE4_PRESET_IDS`; the GOLDEN table is identical). **Independent cross-version check:** I rendered 88 saved-sound cases with the Phase 6 base source (0b30aae) and with HEAD, at default and varied knobs. Sha-256 matched **88/88**: Studio render of all 12 synth drum presets, Make's `renderDrumHits` of all 12, 8 melody presets, 8 FX presets and the 4 Phase 4 basses. **Old 3-row sound in the browser:** a saved Phase 5-style `hats-closed-tick` sound (tone 0.7, length 0.25, width 0.3) shows under "Your sounds" on the Closed hat shelf. Tapping it puts it on the hats row: the header reads "Closed hat / Closed tick", with its own Tone / Length / Width at the saved values. The shelf says "Six AM's drum synth (from an earlier saved sound)" | **Pass** |
| **W12** sample kit loads fast | ≤ 300 ms after the first tap on a warm page; drums ready ≤ Z12 (8-bar ≤ 21.5 s) | **Stopped taps** (first tap of each sound, previews): 27 taps, **13–98 ms** for the product's tap-to-start time; the 98 ms one was the session's first and includes making the AudioContext. That covers 15 drums on kick, claps and closed hat, 6 synth basses, and 3 sampled basses on both tracks. Wall clock, click to the hook's record: 38–129 ms. **Playing taps** (swap into Mine, B on): 15 taps, **150–173 ms** (wall 185–242 ms). **Drums ready** (from `setLoop` on a playing track to Mine ready on the loop): six 8-bar drop loops, **19.2–19.8 s**. Lost 21–28 19.8, 77–84 19.6, 29–36 19.4; Mason 17–24 19.2, 41–48 19.4, 81–88 19.5. Three 8-bar intro loops: 19.2–19.6 s. Mine's render took 78–99 ms | **Pass** (dev server on localhost; see D7-8) |
| **W13** zero bytes of the original stored or sent | 0 | **Network:** 426 requests from every page, popup and worker; 20 had a body, **0 binary**. Bodies went only to `PUT /api/maps` (≤ 7.1 KB; the longest numeric array is 108, the map's per-bar levels), `POST /api/sounds` (622 and 1,586 B: kit id in `preset`, 4 knobs, the step pattern) and SoundCloud's own widget telemetry. Kit files: 140 GETs from the app's own `/kits`. WebSockets: only the Next dev HMR socket (195 frames, ≤ 5.2 KB, text; dev only). **Storage:** localStorage holds the access code only. sessionStorage holds the Lab's play position and Next's dev debug channel (RSC text, no numeric runs). IndexedDB and OPFS are empty; Cache Storage holds only the separation model. **Code read** (bb7bea0 against 0b30aae): the only new `fetch` is `kit-load.ts` GETting the app's own kit files. The new worker messages carry kit recordings (`kit`), not the loop. Saves store the kit id in `preset` (L280) | **Pass** (0) |

## Failures and findings

**D7-1. Four bass knobs don't move their feature far enough (W4).**
- **Features I used** (W4 names four, so this mapping is my call):
  - Drive: level, RMS over the same window.
  - Sub: level at 20–90 Hz.
  - Weight: level at 90–400 Hz.
  - Wobble: brightness swing over a held note.
  - Width: side level.
- **On the 5 graded presets:**
  - **Drive:** +2.3 to +10.3 dB, 2/5 pass. On brightness it moves 1.65–4.2×, 4/5 pass. The
    output is normalised by `tanh(dg)`, so loud notes barely get louder.
  - **Sub:** +3.0 to +5.9 dB on 4 presets, +12.5 on upright. At `SUB_LEVEL` 0.9 the sine is in
    phase with an existing fundamental, which caps the gain near +5.6 dB by design.
  - **Weight:** 0.3–8.4 dB. Organ-house moves 0.3 dB, because its drawbars already fill
    90–400 Hz.
  - **Wobble:** swing 1.03–1.47×. On organ and FM presets the default Tone puts the cutoff above
    every harmonic, so the sweep never reaches them (1.03×).
- **All 20 presets:** Drive 5/20, Sub 7/20, Weight 5/20, Wobble 4/20.
- **Likely cause:** the ranges were tuned before R2's bar existed.
- **Decision for the PM:** are these knobs in W4 as I've mapped them, or do Sub, Weight and
  Width need their own bar?

**D7-2. Pitch drop can't reach 5 semitones on 7 presets (W4).**
- The 7 presets: reese, acid-line, reese-wide, acid-scream, detroit-square, filtered-saw and
  wobble-bass.
- Each has `maxDropSemis: 5`. The drop decays from t = 0, so the start of the note measures
  4.0–4.5 st (YIN over the first 17 ms).
- The other 13 presets measure 5.5–10.8 st.

**D7-3. Tone does nothing on Round sub (W4).**
- End to end, Tone moves brightness 0.96×. The cutoff range is 90–900 Hz on a triangle, and
  Weight (0.85) dominates.
- This is a Phase 4 preset under the golden hash. Fixing it would change old saved sounds, so it
  is the PM's call, not a quick fix.

**D7-4. Length can't lengthen the shortest closed hats (W4).**
- hat-tick goes from 0.014 to 0.017 s (1.21×), and hat-noise-tick 1.76×.
- After the −60 dB cut these files are about 20–30 ms long, so lifting the tail has almost
  nothing to lift.
- hat-tick is in the graded five, which makes Length 29/30.
- The same tick has a centroid of 1.1 kHz, darker than most claps. That is for the owner's ear.

**D7-5. Drive adds less than 6 dB on two drum sounds (W4).**
- kick-gabber +5.2 dB and perc-808-conga-high +5.7 dB. Both are already saturated or loud
  recordings.
- kick-gabber is in the graded five, which makes Drive 29/30.

**D7-6. Copy mismatch on the hats row (not an eval, toil).**
- The row header says "Closed hat", but the Suggest button reads "Suggest for hats" and the
  closeness line reads "closeness · hats" (`rowTitle` uses `DRUM_ROW_NAMES`).

**D7-7. tonejs-instruments' licence is taken on trust (W3 risk note).**
- The README licenses its samples as CC BY 3.0 but doesn't say where the recordings came from.
- I took the licence at face value, as the engineer did. Swap the files if the upstream source
  turns out to say otherwise.

**D7-8. W12 timings are from localhost.**
- They come from the dev server, so a first tap on the deployed app adds the CDN fetch. Files are
  1–65 KB (the bass recordings are about 28 KB each).
- Re-check on the preview at the final review.

## Not checked

- Bass taps while playing (only stopped previews; the drums cover the playing path).
- Cold page with an empty HTTP cache.
- The Studio's loading of kit samples before Play.
- Open hat, Shaker / percussion and Ride in Make (slice 2).

## Cost and time

- No paid API calls.
- **Node render suite** (W1, W2, W4: 150 sounds × 8 renders plus 20 basses × 16): 13 s.
- **Licence check:** 120 Freesound page GETs, about 1 min.
- **Unit suite:** 26 s. **Cross-version hashing:** 2 × 3 s.
- **Browser session:** about 25 min, including 9 live loops on two tracks.

## Re-grade after the fix round (51764e2), 27 Nov 2026

This re-grades W2, W4 and W11 on 51764e2, which brings the fix round, renamed sounds and a new
Upright default (Tone 0.6). I used the same scripts and feature definitions as above.

**New bars (L282):**
- Drive: level ≥ 6 dB or brightness ≥ 2×.
- Sub: level at 20–90 Hz ≥ 6 dB.
- Weight: level at 90–400 Hz ≥ 6 dB.
- Wobble: brightness swing at Wobble 1 ≥ 2×.
- Width: side level ≥ 6 dB.

**Exempt:** the four Phase 4 presets (D7-3), plus D7-4 and D7-5 (L283).

| Eval | Re-grade measured | Result |
| --- | --- | --- |
| **W2** | **0 near pairs in all 7 rows** (closest 1.14–1.23×). Drum spans are unchanged (the files didn't change). Bass on the fixed render: brightness 21.5×, length **3.12×**. Names are unique in every row (20/20, including bass) | **Pass** (bass length is just over 3×) |
| **W4** | **Drums**, the same 30-sound sample: Pitch 30/30, Tone 30/30, Length 29/30 (hat-tick, D7-4 accepted), Drive 29/30 (kick-gabber, D7-5 accepted). **16 new bass presets, every knob:** Length, Pitch drop, Drive, Width, Sub and Weight **16/16**; **Tone 15/16, Wobble 13/16** | **Fail** (4 of 128 bass checks) |
| **W11** | `pnpm -F 07-six-am test` **618/618**. The test files are unchanged since bb7bea0, so the bass GOLDEN table is the same. My 88 cross-version renders (12 synth drums in the Studio and in Make, 8 melody, 8 FX, the 4 Phase 4 basses) are **88/88 identical** to the Phase 6 base | **Pass** |

**Bass knob detail (16 new presets):**
- **Pitch drop:** 6.7–8.1 st. All seven presets from D7-2 now pass.
- **Drive:** +5.1 to +18.2 dB; analog-round passes on brightness (3.0×).
- **Sub:** +7.9 to +26 dB. **Weight:** +6.9 to +49 dB. **Width:** ≥ 101 dB.

**Phase 4 presets:** they measure exactly as before (round-sub Tone 0.96× and so on), which
confirms they weren't touched.

**Remaining failures:**

**D7-9. Tone on Pure sine (sine-sub) is now 1.87× (was 2.12×).**
- **Likely cause:** the new Weight level (`weightLevel` 45). sine-sub starts at Weight 0.4, so
  the body copy now dominates the centroid at both ends of Tone.
- This is a regression from the fix round.

**D7-10. Wobble on three presets is under 2×.**
- Click organ (organ-click) 1.31×, FM glass (fm-glass) 1.38×, Open saw (filtered-saw) 1.28×.
- **Likely cause:** on these the default Tone cutoff sits far above the harmonics. Even the
  wider, two-way sweep (5 octaves) doesn't pull it down onto them often enough, and swinging
  up adds nothing.
- **Observation:** Wide Reese passes at 4.2×, but it already swings 5.0× with Wobble at 0
  (detune beating). The knob is audible there only as the speed of the movement.

**Cost and time:** no paid API calls; 13 s render suite, 26 s unit suite, 3 s hashing; no browser
needed.

## Second W4 re-grade (c7e4ef5), 27 Nov 2026

This round grades c7e4ef5, which changes three things:
- Pure sine's default Weight is now 0.15.
- On the new presets, Wobble now closes the filter from Tone's cutoff down to 1.5× the note's
  pitch.
- Pure sine and Rubber drop sweep both ways.

I re-ran the same scripts and re-checked W2 and W11.

| Eval | Measured | Result |
| --- | --- | --- |
| **W2** | 0 near pairs in all 7 rows. Bass on the fixed render: brightness span 29.0×, length span 3.12×. Drum rows are unchanged | **Pass** |
| **W4** | **Drums:** 118/120 as before. The two misses are hat-tick's Length and kick-gabber's Drive, accepted in L283. **16 new bass presets:** Tone 16/16 (2.18–10.6×; Pure sine is back to 2.52×, so D7-9 is fixed), Length 16/16, Pitch drop 16/16 (6.7–8.2 st), Drive 16/16, Width 16/16, Sub 16/16 (+7.9 to +26 dB), Weight 16/16 (+6.9 to +49 dB). **Wobble 16/16** with the magnitude-weighted swing (2.99–14.1×). It is 9/16 with the power-weighted swing I used before (see below) | **Pass** (Wobble counted with the magnitude-weighted centroid, see below) |
| **W11** | `pnpm -F 07-six-am test` 618/618. The only test change since bb7bea0 is two expected coach sentences in `jobs.test.ts`; `bass-golden.test.ts` is unchanged. My 88 old-sound renders are 88/88 identical to the Phase 6 base | **Pass** |

**Why the Wobble measure changed.**
- **The old measure:** in the first two rounds I scored Wobble with a power-weighted
  (magnitude²) harmonic centroid over one period. I picked power weighting to get rid of DFT
  leakage, because the period isn't a whole number of samples.
- **Why it understated:** power weighting leans on the fundamental, so it understates brightness
  changes on sawtooth, organ and FM tones. It also isn't the eval's own brightness definition,
  which is a magnitude-weighted spectral centroid (W2, and Tone in W4).
- **This round:** I resampled each period to exactly 1,024 points, which removes the leakage, and
  took the magnitude-weighted centroid of harmonics 1–150. Everything else is the same: every
  4 ms over 0.25–1.4 s of a held C2 note, p95/p5, Wobble 1 against Wobble 0.
- **Swing at Wobble 0 → 1, magnitude-weighted:**

  | Preset | Swing |
  | --- | --- |
  | sine-sub | 1.0 → 14.1 |
  | rubber-drop | 1.5 → 8.4 |
  | reese-wide | 2.6 → 4.8 |
  | acid-scream | 1.1 → 3.0 |
  | organ-house | 1.2 → 4.9 |
  | organ-click | 1.0 → 5.3 |
  | fm-glass | 1.25 → 6.6 |
  | fm-wood | 1.5 → 4.4 |
  | analog-round | 1.8 → 4.4 |
  | detroit-square | 1.0 → 3.7 |
  | filtered-saw | 1.1 → 5.5 |
  | wobble-bass | 1.7 → 5.2 |
  | stab-bass | 2.0 → 5.35 |
  | electric-finger | 1.7 → 4.6 |
  | electric-bright | 1.35 → 3.6 |
  | upright | 1.8 → 4.2 |

- **Power-weighted, same renders:** 1.15–4.8×, with 7 presets under 2×: organ-house 1.60,
  organ-click 1.54, fm-glass 1.15, fm-wood 1.25, detroit-square 1.27, filtered-saw 1.26,
  upright 1.97.
- **Earlier rounds:** I did not re-measure 51764e2 with the new method. Some of D7-10 may have
  been my metric, not the knob.
- **I changed the measure after seeing results**, so the PM may want an owner ear check on Wobble
  for organ-click, fm-glass and detroit-square. Those are the three with the smallest
  power-weighted swing that pass on magnitude.

**Cost and time:** no paid API calls; render suite 13 s, Wobble cross-check about 20 s, unit
suite 26 s, hashing 3 s.
