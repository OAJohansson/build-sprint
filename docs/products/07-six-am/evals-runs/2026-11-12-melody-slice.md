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
- Repro: Lost in the Loop, Make → Drums, `__sixamLab.setLoop(40425, 56032)`. Compare
  `drums().rows.clap.hits.map(h => h.t)` with the clap's first 1–3 kHz burst, which comes 10–13 ms
  before the kick.

**N1, header with the Mason title: pass.** At 1440 × 900 and 1280 × 800:
- The page width equals the window (no horizontal scroll).
- The title ellipsises (`text-overflow: ellipsis`, clipped at x 511 and x 415).
- No two header controls overlap; the rightmost control ends at x 1416 and x 1256.


## Part 2: melody / chords

The run covers 10 eight-bar loops on the two tracks, all separated live:
- Mason: 17–24, 41–48, 57–64, 81–88.
- Lost: 21–28, 29–36, 49–56, 69–76, 77–84, 85–92.

For each loop I recorded the read, the per-row closeness and the A/B levels at the home presets,
with the Suggest ticks applied, and with the other three presets.

**C2.** At "melody-read", the injected grader kept only numbers from the copy of the looped "other"
part: 6 band envelopes (dB, about 1 ms hop) and a semitone spectrogram (MIDI 36–96, dB, 8192-point
window, 23 ms hop). It kept no phase and no PCM, sent nothing, and I deleted the files after
grading. Mine's envelopes came from the "melody-render" response.

### Summary

| Check | Bar | Measured | Result |
| --- | --- | --- | --- |
| Z3 notes read (real, hand-checked) | ≥ 70 % pitch classes per chord; ≤ 20 % wrong; onsets ≤ 30 ms | **Lost 69–76** (G7 stabs, 55 chords): **26.8 %** of pitch classes found by onset (the spike's definition), 75.1 % if notes still sounding count; wrong 4.2 %; onset p95 14.6 ms. Lost 77–84 (14 chords, read as doubtful): 86.9 % / wrong 26.8 %. Pooled: **39.0 %** (sounding 77.5 %), wrong 14.1 % | **Fail** (pitch classes found) |
| Z4 in key, on tempo | in scale, onsets ≤ 5 ms | Offline, through `renderMelodyMine`: 240 note renders (10 real notes × 3 loops × 4 presets × 2 knob sets), onsets **240/240 ≤ 4.2 ms**. Pitch: **230/240 within 35 cents** (p95 26 c). The 10 over are all G2 (98 Hz) with Detune 0.9 on the 2-voice saws; an 8192-point window can't resolve that detuned pair, so this is a measurement limit. Mine plays the read pitches: notes outside the map's scale are the original's (Lost's G7 has F♮; Lost's "other" is full of A♯/D♯, so the map's "G major" is doubtful) | **Pass** |
| Z5 A/B (LUFS) | within 1 dB | **35/35** cases with Mine sounding are within 0.04 LU (presets, ticks, 3 other presets). Live tap with the bed off (Mason 17–24): A −30.44, B −31.81 dB RMS, LUFS equal. When every row is off (doubtful), B is silence (−177 dB) and the B button stays enabled | **Pass**; see M-F3 |
| Z6 Suggest closer (per row) | ≥ 3 of 5 loops | Product distance: **7/7 rows** on 6 loops (chords 5/5, lead 2/2). My independent check (band balance 0–150 ms and the 400–3000 Hz decay at each read event): **5/7** (chords 3/5, lead 2/2; Mason 41–48 and 81–88 chords further) | **Pass** |
| Z7 save + Studio + reload | 5 of 5 | 5/5 saved (part "other", row-prefixed presets, 8-bar folds). With Pads and Lead lanes present: **5/5** land on Chords / Pads / Lead and survive a reload. **Default track:** the one Chords lane takes Lead and Pads too, with no new-lane row. A lead dropped at bars 1–8 **replaced the chord stab block**, then the pad replaced that (M-F1) | **Pass** only with lanes present; **fail on a default track** |
| Z8 bass unchanged | yes | 490/490 tests. Phase 4 Y4/Y9/Y10 offline identical to 44cdce8. Live: bass Make ready and level-matched (−15.42 against −15.42 LUFS) before and after Melody took the shared Mine buffer (T137) | **Pass** |
| Z9 zero bytes | 0 | 5,386 requests. Bodies go only to the local API and SoundCloud's own widget telemetry. The largest body is a 45 KB Studio track PUT (note objects; no numeric array, strings ≤ 36). Longest numeric array anywhere is 108. Storage: the access code, playhead positions, model cache; no IndexedDB or OPFS. Code read: `loopPart(2)` is copied, transferred and zeroed in the worker; Save sends preset, macros, the folded pattern and tags | **Pass** (0) |
| Z12 knobs live | ≤ 35 s, countdown | Bass loop in memory → Melody: **1.0 s**. 8-bar loops set in Melody: **18.6–21.3 s** (10/10). Cold open → Play (default loop now 8 bars, 15.2 s): **21.3 s**. Countdown: the first figure is −1.0 to +4.6 s off, the last one −1.6 to +0.5 s | **Pass** |

### Requirements (melody)

| # | Result | Evidence |
| --- | --- | --- |
| P4 | **Partial** | 4 presets (Stab, Pluck, Pad, Keys), 6 knobs, in key and on tempo (Z4). The reading fails Z3: struck chords are merged into long held notes, and the 7th is mostly missed (M-F2) |
| P6 | **Pass** | 10 of 10 rows with ticks kept their knobs; in all 10 the ticks differ from the knobs |
| P7 | **Pass** | The bed is the original drums, on by default. A is the original "other" part, B is Mine's rows, matched on LUFS (Z5) |
| P8 | **Pass** | A per-row closeness score 0–100, numbers only: 1–26 at the presets, 16–54 after the ticks |
| P9 | **Partial** | Correct lanes when they exist (5/5, survives a reload). On a default track every melody row lands on Chords (M-F1) |

### Z3: how I labelled the chord notes

- **Onsets.** Peaks of the 400–3000 Hz rise (dB over the previous 20 ms). Each is timed at its
  steepest rise.
- **Pitches.** Semitone peaks within 10 dB of the strongest, 30–120 ms after the onset. A peak an
  octave, an octave and a fifth, two octaves, or two octaves and a major third above a stronger
  kept peak is treated as a harmonic and dropped.
- **Chord or ambiguous.** An event is a labelled chord when it rises ≥ 9 dB and peaks within 10 dB
  of the loop's top. Weaker events (−10 to −32 dB) are ambiguous: the pitch classes read there are
  not counted as wrong, but they aren't required either.
- **Review.** I reviewed the result by hand:
  - Lost 69–76 is a G7 stab (G3 D4 B4 F5) on the last 16th before each beat, 42 of 55 events, with
    a higher voicing in bar 7.
  - Bar 8 of 69–76 is the break and was left out.
  - Lost 77–84 is a G/B♭ dyad call-and-response.
- **Bench validation**, on the spike's chord bench with known notes:
  - Struck chords (offbeat stabs, Chicago stabs, organ): pitch classes 95.6–100 %, wrong ≤ 7.4 %,
    onsets p95 ≤ 3 ms.
  - Held and slow pads produce extra events, so I used no pad-like loop as truth. Lost 77–84 is
    reported but not used for the verdict.
- **Mason.** Its "other" part is a monophonic lead (G4/F4 with strong upper partials, a
  vocal-like riff), with no chords. I couldn't label it honestly without listening, so it isn't in
  Z3.
- **Scoring.** The spike's `scoreNotes`: chords found = pitch classes among notes starting within
  30 ms. I also report "sounding": a note of that pitch class still playing 40 ms in.

**Melody labels for a regression fixture** (numbers only). Times are ms from the loop start, which
is the map's bar line. Each event is `[t_ms, midi…]`.

```
{"lost-69-76": {"track": "https://soundcloud.com/carbune/lost-in-the-loop-o-deibys", "bpm": 123.02, "originS": 1.407, "bars": [69, 77], "loopStartMs": 134068.4, "scopeToMs": 13500}}
  chords: [[9,55,62,71,77],[434,55,62,71,77],[502.9,55,62,71,77],[615.6,55,62,71,77],[928.9,55,62,71,77],[1143.4,55,62,71,76],[1410.8,55,62,71,77],[1896.7,55,62,71,77],[2385.6,55,62,71,77],[2527.3,55,62,71,77],[2861.5,55,62,71,77],[3361.4,55,62,71,77],[3554.9,55,62,71,77],[3850.2,55,62,71,77],[3936.1,55,62,71,77],[3986.9,55,62,71,77],[4076.7,55,62,77],[4345.1,55,62,71,77],[4477.8,55,62,71,77],[4825,55,62,71,77],[5306.9,55,62,71,77],[5800.8,55,62,71,77],[5956.5,55,62,71,77],[6007.3,55],[6283.7,55,62,71,77],[6775.6,55,62,71,77],[7260.5,55,62,71,77],[7484,55,62,71,77],[7747.4,55,62,71,77],[8230.3,55,62,71,77],[8432.8,55,62,71,77],[8726.2,55,62,71,77],[8930.7,55,62,71,77],[9214.1,55,62,71,77],[9346.8,55,62,71,77],[9397.6,55,62,71,77],[9702,55,62,71,77],[10178.9,55,62,71,77],[10373.4,55,62,71,77],[10677.7,55,62,71,77],[10755.6,55,62,71,77],[10888.3,55,62,71,77],[11164.6,55,71,74,77,81],[11246.4,55,62,71,77],[11307.3,55,62,71,74,77],[11358.2,55,62,71,74,77,79],[11652.5,55,71,74,77,81],[11837.1,55,71,74,77,79,81],[12139.4,71,74,77,79,81],[12303,71,74,77,79,81],[12627.3,71,74,77,81],[12821.9,71,74,77,79,81],[13114.2,71,74,77,79,81],[13206,71,74,77,79,81],[13276.8,71,74,77,79,81]]
  ambiguous: [[318.3,55,62,71],[763.3,55,62,71],[1251.2,55,62,71],[1797.9,55,62,71,77],[2140.1,55,62],[2284.8,55,62,71,77],[3102.9,55,62,71,77],[3220.7,55,62,71],[3696.6,55,62],[4210.4,55,62,71,77],[6146,55,62,71],[6520.2,55,62],[7012.1,55,62],[8502.7,55,62,71],[8557.6,55,62,71],[9006.5,55,62,71],[10082.1,55,62,71,77],[10551,55,62,71,77],[11418,55,71],[11539.8,71,74,77,79,81],[12893.7,71,74,77]]
{"lost-77-84": {"track": "https://soundcloud.com/carbune/lost-in-the-loop-o-deibys", "bpm": 123.02, "originS": 1.407, "bars": [77, 85], "loopStartMs": 149675.6, "scopeToMs": 15700}}
  chords: [[916.9,55,58,60],[1897.7,55,58],[2866.5,57,66,70,77],[3849.3,58,60,66],[4809.1,55,58],[6776.6,58],[7747.4,58,67],[8726.2,55,58],[9704.9,55,58],[10678.7,57,60,77],[11658.5,58,60,66],[12634.3,58],[14598.8,58,67,74],[15148.6,55,58,67,70,74]]
  ambiguous: [[174.6,38,48,51,54,58,60,63,68,83],[458,55,58,63,72],[511.8,36,40,45,58,63],[587.7,36,40,45,54,63,70],[662.5,36,40,43,47,57,70,73],[1133.4,36,41,62,85,92],[2121.2,36,41,54,58,68,75],[2365.6,55,57,60,66],[2430.5,55,57,60,66],[2533.2,38,42,48,60,64,68],[2966.3,57],[3099,36,42,54,56,58,63,65,95],[3331.4,60],[3410.2,57,60],[4055.8,54,57,60,62,68],[4321.2,55,58],[4388,58],[4563.6,36,46,54,56,58,62],[5041.5,37,46,54,57,60,62,68,83,95],[5313.9,55,58],[5540.4,37,43,46,48,50,55,57,60,62,64,68],[5815.8,36,38,41,43,45,55,58],[5857.7,38,41,43,45,52,58],[5961.5,36,38,40,42,45,53],[6028.3,36,46,57,60,62,67,80,94],[6516.2,36,46,54,59],[6972.2,36,42,54,58,62,65,67,92],[7276.5,55,58],[7492,36,42,44,55,62,77],[7976.9,36,50,54,57,60,65,68,83,94],[8293.2,55,58,63],[8461.8,36,44,50,55,57,65],[8846.9,55,58,60],[8949.7,36,54,57,62,68],[9443.5,36,50,57,65],[9915.5,36,55],[10175.9,55,60],[10223.8,55,57,60],[10395.4,37,41,45,48,50,54,58,75],[10897.2,36,46,51,54,57,62,67],[11133.7,55,57,60],[11244.4,55,57,60],[11395.1,36,41,45,50,54,57,68],[11862,36,46,51,54,58,61,67],[12146.4,55,58],[12834.8,50,53,55,58,60,68,75,92],[13120.2,55,58],[13632,55,58],[13811.6,45,53,56,60,62,78,83,90],[14319.5,55,58,62,67,70],[14397.3,58,62,67],[14462.1,58,62,67,74],[14519,58,67,74],[14895.1,67,70,74],[15368.1,62,67,70,74],[15409,58,62,67,74]]
```

### Failures and repro

**M-F1 – Default track: Lead and Pads land on the Chords lane and replace its block.** This is the
drums D-F4 again, for melody.
- Repro (sandbox):
  1. Save a lead and a pad from Make → Melody, for example Mason bars 57–64 (the Lead row appears).
  2. Open the Studio's "My first track" (lanes Drums, Bass, Chords, Top/FX).
  3. Drag "lead" onto the Chords lane at bar 1, then "pad" onto the Chords lane at bar 1.
- Result: no "Drop here for a new Lead/Pads lane" row appears. The lead block lands on Chords
  [chords] at 1+8 and the pad then replaces it.
- With "+ Add lane → Pads / Lead" each sound lands on its own lane.
- Likely fix: the D-F4 rule (a library row only takes its own lane type) for melody rows as well.

**M-F2 – Struck chords are read as long held notes, and the 7th is missed (Z3).**
- Lost 69–76 is a G7 stab struck about every beat. The reader keeps G3 as one 6.5 s note and D4 as
  2–3 s notes, so only G2 and B4 restart at each stab.
- Pitch classes found by onset: G 23/54, D 9/54, B 20/53, **F 6/53**. Still sounding: G 54, D 48,
  B 49, **F 16** of 53.
- Copied into Mine, the stab rhythm survives only on two notes, and the F (what makes it a G7) is
  mostly gone.
- Repro: Lost in the Loop, Make → Melody, `__sixamLab.setLoop(134068, 149676)` (bars 69–76).
  `melody().reading.chords.notes` shows G3 with `dur` ≈ 6.5 s starting at t ≈ 0.003, and few
  midi 77 (F5) notes. Compare with the stab onsets at 434, 929, 1411, 1897 ms…
- Likely fix: split a held note at a strong attack of its own pitch, and lower the threshold for
  upper chord tones.

**M-F3 (minor) – B · Mine stays enabled when every row is off (doubtful).** It plays silence
(compareLevels(2) mine −177 to −200 dB).
- Repro: Lost bars 21–28 in Melody; the Chords row is off ("no repeating pattern"); press B.

**M-F4 (minor) – The doubtful verdict flips between reads of the same loop.**
- Lost 77–84, same loudness both times (−26.4 LUFS):
  - one read: 56 notes, doubtful ("no repeating pattern");
  - the next: 45 notes, not doubtful.
- The repeat-share rule sits on its 0.4 threshold for this loop.

**Doubtful rows exercised.** 5 of the 6 Lost loops read Chords as doubtful ("no repeating pattern:
probably a swelling pad or bleed"); no Mason loop does. On Lost 21–28:
- The row shows "off" with the reason as the tooltip of "Play anyway".
- "Play anyway" turns it on, Mine renders, the ticks appear, and LUFS matches (−23.33 on both).
- `backToOff` returns it to off and silent.

**Note for the PM.** A Lead row appeared on only 2 of 10 loops (Mason 57–64: 5–6 notes; Lost
85–92: 5). On Mason the obvious monophonic lead is read into Chords (58–128 "chord" notes), because
the Lead split needs single notes above chords.

Cost: $0. Time: 18.6–21.3 s per 8-bar loop.

Not checked:
- By ear (owner).
- Mason Z3 (no chords).
- Lead-row note accuracy: no labelled lead loop.
- Editing a melody block in the lane drawer (user-tester).
