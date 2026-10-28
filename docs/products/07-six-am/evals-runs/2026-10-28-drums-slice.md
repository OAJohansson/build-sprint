# Drums slice evals (Phase 5, slice 1), 28 Oct 2026 (data-evals)

These grades are for the drums checks in `evals.md` (Phase 5: Z1, Z2, Z4–Z9, Z12) and the drum parts
of P1, P3 and P6–P10 in `kickoff.md`. I only graded. I changed no product code. The build is HEAD
077e188 on `claude/07-six-am-make-layers-1ed1b6`.

**Setup.** I used the sandbox dev server on :3017 (`ACCESS_CODE=test-code`, in-memory store, no
Supabase). Chrome 156 ran with its own profile and CDP on :9517, plus
`--auto-select-tab-capture-source-by-title="Six AM Deck"` and `?quiet=1`. The Deck played aloud on
the Mac. I PUT two real-track maps from Phase 4 into the sandbox:
- Mason Flint remix of *It Just Won't Do*: 126.05 BPM, G minor.
- Cărbune, *Lost in the Loop*: 123.02 BPM, G major.

I ran 9 eight-bar loops, all separated live by the Lab in the browser:
- Mason: 17–24, 41–48, 57–64 (breakdown), 81–88.
- Lost: 21–28, 29–36, 69–76 (build), 77–84, 85–92.

The driver scripts live in the session scratchpad (`dg/`).

**C2 handling.** An injected grader script tapped Make's worker message at "drums-read", which is the
copy of the looped drum part the page was about to hand to the worker. From it the script kept only
numbers: 6 band envelopes (30–120, 120–400, 400–1k, 1–3k, 3–7k and 7–16k Hz) in dB, at a hop of
44 samples (about 1 ms). It never kept PCM, and nothing was sent anywhere. I kept the envelope files
in the scratchpad only while grading and deleted them at the end. Mine's envelopes came from the
"drums-render" response, which is the owner's own render, not the original.

## Summary

| Check | Bar | Measured | Result |
| --- | --- | --- | --- |
| Z1 hits on time (real tracks, 4 loops, hand labels) | ≥ 90 % found within 10 ms, ≤ 10 % extra | **85.1 % found, 25.6 % extra** (289 labelled events). Kicks are the cause: only 55 of 119 reader kicks fall within 10 ms of the attack. On Mason 0 of 55 do: the reader is **16–48 ms late** (median +45). Claps 61/64 and hats 127/127 are within 10 ms (median error 0–1 ms). Per loop: Lost 85–92 passes (100 % / 3.8 %); the other three fail | **Fail** |
| Z2 labels right | ≥ 85 % of found hits | **63.3 %** pooled. Per loop: Lost 85–92 94.8 %, Lost 21–28 72.9 %, Mason 17–24 45.3 %, Mason 81–88 44.9 %. On Mason every open hat on the offbeat is also read as a clap (31–32 extra clap labels per loop) | **Fail** |
| Z1/Z2 synthetic (spike re-run) | same | 99.2 % found, 0.7–2.3 % extra, labels 90.8–95.4 %. This reproduces the spike exactly | pass (synthetic only) |
| Z4 drums on tempo | onsets ≤ 5 ms | Offline, through the worker's own `drums-render` job and `fitLoop`: **1,152 of 1,152** hits start within **0.98 ms** of where Make means them. That is 12 presets × 2 knob settings × 4 real readings, each hit rendered alone, onset at −20 dB of its peak. Live, Mine's hits match the reader's times. But the reader's kick times are late (Z1), so on Mason **Mine's kick lands 16–48 ms after the original's** | **Pass** (against intent); see F1 |
| Z4 in key (kick Tune) | in scale | Tune is not snapped. The presets sit 17–25 cents off the nearest note. Round 808 (F♯) is outside G minor | Observation |
| Z5 A/B level-matched | within 1 dB perceived (LUFS) | **40 of 45** cases are within 1 LU (9 loops × home presets, ticks, and 3 other preset sets). The 5 over: Tight + Rim + Shaker +1.03 to +1.53 LU on 3 loops; on the build loop (Lost 69–76) the ticks give +1.37 and Round 808 + Tight snare + Ride gives −2.37. Live tap with the bed off (Lost 29–36): A −10.87, B −11.81 dB RMS (LUFS-matched) | **Fail** (89 %) |
| Z6 Suggest closer than the preset (per row) | ≥ 3 of 5 loops | The product's own distance fell on **9 of 9 loops for every row** (27 of 27 at read, 3–84 %; every later Suggest also fell). My independent check, the hit envelope in each row's band: clap 8/9, hats 8/9, **kick 2/9** (0.4–2.8 dB further). The closeness score went up on 7 of 9 loops | **Pass** (product measure); kick fails the independent check |
| Z7 Save + Studio drop, survives reload | 5 of 5 | API: **5/5** saved (part `drums`, row-prefixed preset, GM notes 36/39/42, `off` kept). Studio: with Kick, Claps & snares and Hats lanes present, **5/5** land on their lane and survive a reload. On the default track, a dropped clap lands on the "Drums" (kick-type) lane and **overwrites the kick block**; no new-lane offer appears (F4) | **Pass** with F4 |
| Z8 bass unchanged | yes | `bass-golden.test.ts` passes. Phase 4's offline Y4, Y9 and Y10 give identical results (timings aside) at the slice base 58cfc4e and at HEAD. Live bass Make on Mason 17–24: ready, 20 notes, ticks, LUFS −15.44 against −15.41 | **Pass** |
| Z9 zero bytes of the original | 0 | Network: 4,771 requests from every page, worker and iframe. Bodies go only to the local API (largest 7.8 KB; longest numeric array 108) plus SoundCloud's own widget telemetry (≤ 6.3 KB, no arrays). Sounds POST: preset, macros, pattern, tags only. Storage: the access code, playhead positions and Next dev debug entries; IndexedDB and OPFS empty; Cache Storage holds only the model (180.5 MB). Code read: the worker zeroes the drum copy after reading (`jobs.ts`); the slice has no new fetch or storage path apart from the sounds API | **Pass** (0) |
| Z12 knobs live quickly | ≤ 35 s after entering on a playing loop, with a countdown | Loop already in memory, then switch to Drums: **0.8 s**. 8-bar loop set in Drums: **18.2–21.0 s** (9 of 9). 16-bar loop set in Drums at 123 BPM: **35.1 s**. Opening Make → Drums and pressing Play (default 16-bar loop): **38.3 s** from the click, 29.2 s from parts playing. A countdown is always shown, but it runs early (it says "5 s" about 1 s before ready, starts at 23–39 s) | **Partial**: pass for 8-bar and in-memory loops; 16-bar paths 35.1–38.3 s |

### Requirements (drums)

| # | Result | Evidence |
| --- | --- | --- |
| P1 | **Partial** | The switch reads Bass · Drums · Melody · FX, with Vocals "not yet". Name and Save keep their place (y 692/693). In Drums the preset, Suggest, A/B and score sit **126–138 px lower** than in Bass. At a 1440 × 741 window, A/B and closeness are below the fold in Drums (y 763–768) but visible in Bass (y 625) |
| P3 | **Fail (reading)** | The structure is all there: three rows on the 16th grid, offsets kept as `off`, 4 presets per row, knobs 4/4/3. But the reading fails Z1/Z2 on Mason (late kicks, claps on hat steps), and the grid phase is unstable (F3) |
| P6 | **Pass** | 27 of 27 rows kept their knobs after Suggest, and in all 27 the ticks differ from the knobs |
| P7 | **Pass with Z5 caveat** | The bed is on by default. A is the original drum part, B is Mine's three rows. Matching: 40/45 within 1 LU |
| P8 | **Pass** | The closeness score runs 54–88 over the 9 loops, measured in memory, numbers only (`captureDrums` agrees with the worker's score) |
| P9 | **Partial** | Saved per row, and lands on Kick / Claps & snares / Hats when those lanes exist (5/5, survives a reload). On a default track every row lands on the one Drums lane (F4). Editing in the lane's drawer was not checked (left to the user-tester) |
| P10 | **Pass** | See Z9 |

### Guardrails

| Guardrail | Result |
| --- | --- |
| No audio of the original stored, uploaded or sent | **0**, see Z9 |
| AI keys never in the bundle or responses | **0**. I checked the values of `ANTHROPIC_API_KEY`, `STABILITY_API_KEY` and `SUPABASE_SECRET_KEY` against 27 served chunks (5.0 MB) and the whole network log, without printing them; there were 0 `sk-ant-` patterns |
| Bass Make flow unbroken | **Yes** (Z8) |
| Readable text, hit areas | Not mine (critic, user-tester) |

`pnpm -F 07-six-am test`: 458/458 pass.

## Z1/Z2 on real tracks: how I labelled

The Lab separated each loop live, and I labelled hits without listening:

1. **Position tables.** For each loop I printed, per bar and per 16th column on Make's grid, each
   band's level (dB under the band's 99th percentile) and its rise over the previous 20 ms. The
   30–120 Hz band is power-averaged over 10 ms. A 2 ms window shows a kick's waveform, not its
   envelope.
2. **Hand labels.** I read the tables. The kick is where 30–120 Hz rises and peaks within about
   2 dB of its top, or where 120–400 Hz does in the high-passed bars before a section. A clap/snare
   is where 1–3 kHz stands out (−7 to −2 dB) beyond what a kick alone gives in that loop. A hat is
   where 7–16 kHz is near its top and louder than 1–3 kHz. Hits with a flat spectrum that fit no
   row were marked ambiguous, and I scored them neither way: the perc hit at Mason col 4/9/10/12,
   and the faint ghost hats in Lost bars 3/7/8.
3. **Adjudication.** I checked every reader hit that disagreed against the band evidence. One label
   was added: Lost 85–92 has a quieter hat every half bar, about 32 ms after cols 5 and 13 (7–16 kHz
   at −14 to −17 dB). One was marked ambiguous: Mason 81–88 bars 1–4, col 4.
4. **Timing.** Each labelled hit is timed at the steepest rise of its attack band within ±50 ms:
   kick at 120–400 Hz, because its pitch sweep starts above the 30–120 Hz band and that band only
   peaks 15–50 ms later; clap at 1–3 kHz; hats at 7–16 kHz.
5. **Validation on the spike's bench**, where the truth is known: this timing rule lands within
   p95 2.6 ms (kick), 3.2 ms (clap) and 1.2 ms (hats) of the true onsets, over 1,444 hits. A fully
   automatic rule-based labeller I tried first got only 70–88 % labels right on the bench, so I
   did not use it as truth.
6. **Scoring.** The same definitions as the spike's `scoreDrums`: events merged (truth within 5 ms,
   found within 10 ms), on time within 10 ms, extra = unmatched found events / truth events, and
   labels = agreement / union at the matched events.

The labels as columns on Make's grid for that read (bars 1-based; A = ambiguous):

| Loop (grid) | Kick | Clap/snare | Hats | Ambiguous |
| --- | --- | --- | --- | --- |
| Mason 17–24 (22 ms) | 0,4,8,12 every bar; 15 in bars 1,3,5,7; 14 in bar 4 | 4,12 | 2,6,10,14 | col 9 bars 3,7 |
| Mason 81–88 (−49.6 ms) | 1,5,9,13 every bar; 0 in bars 2,4,6,8; 15 in bars 4,8 | 5,13 | 3,7,11,15 | col 10 bars 3,6,7,8; col 4 all; col 12 bars 6–8 |
| Lost 21–28 (50.2 ms) | 1,5,9,13 | 1,9 | 3,7,11,15 | col 14 bars 3,7; col 13 bar 8 |
| Lost 85–92 (−55.4 ms) | 2,6,10,14 | 2,10 | 0 (bars 2–8), 4,8,12, and 5.26, 13.26 | cols 6,14 bars 7–8 |

| Loop | Labelled events | Reader (kick/clap/hats) | Found | Extra | Labels | Kick within 10 ms | Kick error (median, range) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mason 17–24 | 85 | 28 / 49 / 43 | 76.5 % | 48.5 % | 45.3 % | 0/28 | +45 ms (+17…+48) |
| Mason 81–88 | 86 | 28 / 54 / 41 | 75.4 % | 43.5 % | 44.9 % | 0/27 | +44 ms (+16…+48) |
| Lost 21–28 | 80 | 32 / 16 / 37 | 86.5 % | 10.8 % | 72.9 % | 25/32 | +6 ms (+4…+29) |
| Lost 85–92 | 94 | 32 / 16 / 50 | 100 % | 3.8 % | 94.8 % | 30/32 | +5 ms (+3…+27) |
| **Pooled** | 289 | | **85.1 %** | **25.6 %** | **63.3 %** | **55/119** | |

## Findings (for the engineer)

**F1 – Kicks are read late (Z1, P3).**
- The reader times a kick at the low band's energy peak, not at the attack. On Mason's kick, whose
  pitch sweep reaches 30–120 Hz slowly, that is +16 to +48 ms, in two clusters (~+18 and ~+45). On
  Lost it is +3 to +29 ms.
- Mine then plays the kick that late against the original. This shows in Make's own live render:
  on Mason 17–24, Mine's kick attack has a median of +45 ms against the original. With "Bass under
  both" the kick flams against the bass.
- The lateness is also saved: the saved kick has `off` 0.27–0.30 sixteenths on steps 4/8/12.
- Repro: sandbox; open Mason (map from Phase 4); `/map?id=…&quiet=1&mode=make&make=drums`; Play;
  `__sixamLab.setLoop(30573, 45805)` (bars 17–24); `__sixamLab.drums().rows.kick.hits.map(h => h.t)`.
  The values sit about 45 ms after the broadband attack, for example 0.525 s where the attack is at
  0.482 s.
- Likely fix: time kicks from the attack (120–400 Hz, or the broadband flux) and keep the low band
  for detection only.

**F2 – Offbeat open hats are also read as claps (Z2).**
- On Mason, steps 2/6/10/14 get a clap as well as a hat in every bar: 31–32 extra clap labels per
  loop, many of them "faint" but played anyway, because the row is not doubtful.
- The saved clap pattern carries them: steps 2, 4, 6, 10, 12, 14.
- The open 909-style hat has strong 1–3 kHz energy (2–5 dB under that band's top), which passes
  the clap flatness and size gates.
- Repro: as F1, then `__sixamLab.drums().rows.clap.hits.map(h => h.step)`.

**F3 – The grid phase flips between reads of the same loop.**
- Mason 81–88 read twice gave gridMs −49.6 ms (kick on columns 1,5,9,13) and +43.3 ms (kick on
  0,4,8,12).
- The first read would save every row one 16th late against the bar in the Studio.
- Likely cause: the phase is a circular mean against the 8th-note period, so a downbeat about
  50–70 ms off the map's bar line sits near the ±½-16th fold. Anchoring step 0 to the kick nearest
  the bar line would fix it.

**F4 – Studio drop on a default track: every drum row lands on the one "Drums" lane.**
- The default "Drums" lane is kick-type, and `accepts()` matches the whole drums family, so the
  "Drop here for a new … lane" row never appears for a clap or hats.
- A clap dropped at bars 1–8 replaced the kick's block there.
- With "+ Add lane → Claps & snares / Hats", each sound lands on its own lane.
- P9 says clap/snare goes to Claps & snares and hats to Hats; on a default track that needs the
  user to add the lanes first.

**F5 – A/B matching can miss by up to 2.4 LU.**
- `abGain` matches LUFS but clamps to within 0.9 dB of the RMS match (`RMS_LEEWAY_DB`).
- Bright, short sets (Tight + Rim + Shaker) read +0.7 to +1.5 LU louder than the original.
- On the sparse build loop (Lost 69–76): the ticks give +1.37, and Round 808 + Tight snare + Ride
  gives −2.37.
- Repro: Lost 29–36; `drumsDo.preset("kick","kick-tight")`, `("clap","clap-rim")`,
  `("hats","hats-shaker")`; then `__sixamLab.compareLevels(0)` gives mine.lufs − original.lufs =
  +1.11.

**F6 – A noise build reads as dense faint kicks, and is not marked doubtful.**
- In Mason 57–64 (breakdown into a build), the reader finds 46 kicks, all faint, on irregular steps
  (55, 61, 65, 66, 74, 77, 81…88). The 30–120 Hz energy there is a rising wash, not hits.
- The doubtful rule only catches rows with at most one hit per 2 bars, so these kicks play in Mine.
- None of my 9 real loops produced a doubtful row, so "Play anyway" was not exercised on real audio.

**F7 – Suggest's kick ticks don't move my independent measure.**
- The product's distance falls, but the kick's 30–120 Hz envelope gets 0.4–2.8 dB further from the
  original on 7 of 9 loops. Clap and hats get closer on 8 of 9.
- The owner's ear decides whether the kick ticks sound right.

**F8 (minor) – the countdown runs early.** It starts at 23–39 s and says "5 s" or "4 s" about 1 s
before the knobs come alive.

## Cost and time

- $0: no Mentor, no Stable Audio.
- A drum read takes 0.35–0.62 s per 8-bar loop in the worker. Suggest takes 17–73 ms per row (29–42
  renders).
- About 20 s per loop including the live fill. The whole live session took about 40 minutes of
  playback, with the model cached after the first 20 s download.

## Not checked

- By ear: whether Mine's drums feel inspired, and whether the A/B is fair (the owner).
- Editing a dropped drum block in the lane's drawer, and sample-identical Studio playback of drum
  blocks after a reload (the user-tester and the engineer).
- "Play anyway" on a real doubtful row: none occurred on my loops.
- A third track, or tempos far from 123–126 BPM.
- Readable text and hit areas.
