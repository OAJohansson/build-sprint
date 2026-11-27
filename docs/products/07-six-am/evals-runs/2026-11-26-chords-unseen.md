# Chords: reader A on unseen loops (L259), 26 Nov 2026 (data-evals)

This test asks whether reader A (DSP, after the L256 fix round) reads chords right on music its
fixtures never modelled. I graded only and changed no product code. The build is HEAD of
`claude/07-six-am-chords-cdf1b0`; the reader is unchanged since 5977f20. The designer's dev-only
pages under `src/app/dev` were ignored.

**Verdict.** By the numbers, reader A passes H1 and H2 on the unseen set:
- **H1:** root + family 88.0 %, root 92.0 % (25 typed cells).
- **H2:** 100 % of onsets found, 10.9 % extra.
- **H5:** 96 %.

With the old held-out loop added, H1 is 75.9 % / 86.2 % (29 cells) and H2 is 100 % / 11.7 %. Both
still pass. H5 falls to 89.7 %, just under its bar.

**The evidence is thinner than the percentages:**
1. 14 of the 25 typed cells come from one Dubspinna loop (161–168). It plays the same D♭–E♭–B♭m
   progression the fixtures model, as held pads instead of plucks. Without it, the unseen set is
   72.7 % root + family and 81.8 % root over 11 cells: just over both bars.
2. The one new track (Kolter) gives only 5 typed cells. A got all 5 right.
3. H2 rests on 22 labelled onsets, 21 of them from one loop.
4. On sustained and tremolo parts A adds many chord strikes: 60 and 41 struck events on the two
   Kolter loops, where I found no chord attack.
5. The held-out loop moved from 25 % to 0 % between two separations of the same bars (bar 3 flips
   between B♭m and B♭sus2).

My call: H1 and H2 pass on unseen music, narrowly. That is enough to build slice 1 on, with the
re-strike and lead-as-root failures known. It is not enough to call the reader proven.

## Setup

- **Sandbox:** a fresh one on :3017 (in-memory store; `ANTHROPIC_API_KEY` and `STABILITY_API_KEY`
  empty, so no paid call was possible).
- **Maps:** Mason and Lost from `sandbox-seed.mjs`; Retrouvé and Dubspinna from the spike's measured
  values. The new tracks were mapped with Listen and map:
  - Fovos "Work" edit: 151.99 BPM, G♯ major, origin 0.149 s, 164 bars.
  - Kolter "Symphony No 5": 127 BPM, G minor, origin 1.597 s, 160 bars.
  - Hard Reset "Redemption" can't be mapped: SoundCloud only plays a 30 s preview of it.
- **Chrome:** my own (fresh profile, Deck auto-select, `?quiet=1`). Every loop was separated live.
  Each loop got `chordsRead("dsp")` twice, and both reads were identical on every loop.
- **Blind labels:** the Phase 5 method as in `2026-11-26-chords-spike.md`, labelled before any
  chord names were shown (the driver hides them).
- **C2:** numbers only (semitone spectrogram and band envelopes of the copy at "chords-read"). The
  working numbers were deleted after scoring.
- **Fixtures:** these labels are not in `chords-fixture.ts` or any file the builder reads. They
  are only here, in the block marked "Unseen set (not for tuning)".

### Loops tried

| Loop | Used | Why |
| --- | --- | --- |
| Fovos 41–48, 81–88, 129–136 | no | flat chroma (129–136) or one-note lines (81–88, 41–48): no chord |
| Retrouvé 65–72 | no | A♭ C E♭ F G plucks: F minor 7 and A♭6 fit equally, so no honest root |
| Kolter 61–68 | **yes** (bars 3, 8a) | F minor pad, then D major; the rest is the motif in octaves |
| Kolter 73–80 | **yes** (4b, 7, 8a) | C minor under G tremolo strings |
| Kolter 89–96 | no | mixed pitch classes in every half bar |
| Dubspinna 161–168 | **yes** (14 cells) | the loop as held pads, half-bar changes (only 1 strong onset) |
| Dubspinna 33–40 | **yes** (6 cells) | B♭m stabs and F minor stabs. The C m7 / E♭6 stab on beat 1 is ambiguous and not counted |

The 4 unseen loops come from 2 tracks, one of them new (Kolter), with 25 typed cells. The
held-out loop (Dubspinna 73–80) was read again on this build.

## Results

| Loop | H1 root + family | H1 root | H5 | H2 found / extra (best shift) | H16 wall (worker) ms |
| --- | --- | --- | --- | --- | --- |
| Dubspinna 161–168 | 100 % (14/14) | 100 % | 100 % | 1 / 1 found; 22.7 % extra (5 of 22 events) | 794 (572), 554 |
| Dubspinna 33–40 | 50 % (3/6) | 66.7 % | 83.3 % | 100 / 4.8 % (0 ms; 21 onsets, 42 events) | 755 (535), 511 |
| Kolter 61–68 | 100 % (2/2) | 100 % | 100 % | no chord onset labelled; 62 events (60 struck) | 989 (763), 749 |
| Kolter 73–80 | 100 % (3/3) | 100 % | 100 % | no chord onset labelled; 44 events (41 struck) | 812 (592), 549 |
| Dubspinna 73–80 (held out) | 0 % (0/4) | 50 % | 50 % | 100 / 12.8 % (0 ms; 18, 47) | 532 (528), 516 |

| Eval | Bar | Unseen set | Unseen without Dubspinna 161–168 | Unseen + held out | Result |
| --- | --- | --- | --- | --- | --- |
| H1 root + family | ≥ 70 % | **88.0 %** (22/25) | 72.7 % (8/11) | **75.9 %** (22/29) | pass (narrow without 161–168) |
| H1 root alone | ≥ 80 % | **92.0 %** (23/25) | 81.8 % (9/11) | **86.2 %** (25/29) | pass |
| H2 onsets | ≥ 90 %, ≤ 15 % extra | **100 % / 10.9 %** (22/22; 7/64) | 100 / 4.8 % (21/21) | **100 % / 11.7 %** (40/40; 13/111) | pass (thin: 22 onsets) |
| H5 one tap away | ≥ 90 % | **96.0 %** (24/25) | 90.9 % (10/11) | 89.7 % (26/29) | pass unseen; just under with held out |
| H16 read time | ≤ 3 s | 0.51–0.99 s (10/10) | | | pass |

H2 counts only loops with labelled chord onsets. On the two Kolter loops my method found no chord
attack (a held pad and G tremolo strings), so a found rate is undefined. Of A's events there, 54 of
62 and 25 of 44 match not even a weak (ambiguous) rise. The tremolo has no single attack to call
right, so I report those loops apart instead of counting them as H2 extra. If they were counted,
the extra rate would be 50.6 % (86/170).

## Failures

- **U-1. Held pads are struck many times** (the H3 failure, seen on new music). Kolter 61–68 bars 1–3
  are one pad; A plays 60 struck events over the loop (median 131 ms each). Dubspinna 161–168 plays
  pads; A gives 22 events (16 struck) for 1 strong onset. Likely cause: the onset reader
  (`loopAttacks`, L255) takes the swells, the sidechain pump and the tremolo as attacks.
  Repro: Kolter, `setLoop(114983.4, 130101.3)`, `chordsRead("dsp")`, then `events`.
- **U-2. Fm stabs read as B♭sus2 or C♯maj7** on Dubspinna 33–40 (bars 3b and 4b). F A♭ C G against
  the B♭ just before: the bar's B♭ and the G pull it to B♭sus2, and A♭ C plus D♭ from the pad give
  C♯maj7. 2 of 4 Fm cells are right.
- **U-3. Lead as root** on the held-out loop again: Gdim on bars 4a and 8a (CH-7). It is unchanged.
- **U-4. Reads depend on the separation copy.** The held-out loop’s bar 3 read B♭m in the re-grade
  and B♭sus2 now (0 % against 25 %). Repeat reads of one copy are identical.
- **False 7th:** Dubspinna 161–168 bar 8b, D♭ → C♯maj7 (family right; the voicing adds a C).

## Unseen set (not for tuning)

These labels are for grading only. They must not go into `chords-fixture.ts`, tests or anything
the reader is tuned on; once they have been used for tuning, they no longer test unseen music.

```
{"loop":"dub-161-168","track":"https://soundcloud.com/dubspinna/whats-a-girl-to-do-dubspinna-festival-remix-fatima-yamaha","bpm":125,"loopStartMs":308291,"loopEndMs":323651}
  cells: 1a:Db 1b:Eb 2a:Eb 2b:Bbm 3:Bbm 4a:Bbm 4b:Db 5a:Db 5b:Eb 6a:Eb 6b:Bbm 7:Bbm 8a:Bbm 8b:Db
  onsets: [4520.6]
  ambiguous: [201.7,690.8,918.6,1401.9,1632.7,2115.9,2351,2841.5,3602,3966.3,4047.5,4285.5,5009.7,5960.3,6458,6685.9,7881.7,8598.6,9308.3,10036.8,10518.6,11189.1,11274.7,11721.7,11971.3,12200.6,12689.7,14130.8,14367.3,15214.9]
{"loop":"dub-33-40","track":"https://soundcloud.com/dubspinna/whats-a-girl-to-do-dubspinna-festival-remix-fatima-yamaha","bpm":125,"loopStartMs":62531,"loopEndMs":77891}
  cells: 1:amb 2:amb 3a:Bbm 3b:Fm 4a:amb 4b:Fm 5:amb 6a:amb 6b:Fm 7a:Bbm 7b:Fm 8:amb
  onsets: [94.3,905.6,1756,2014.3,3677.5,3935.8,4494.5,4974.9,5596,7516,7774.3,9436,9694.3,11356,11614.3,12174.5,12654.9,13276,13535.8,15068.3,15196]
  ambiguous: [416.5,847.5,2335.1,2432.3,2591.9,2853.2,3509.1,4258,4406,4744.1,4845.7,5220.1,5392.8,5503.1,5855.8,5977.7,6427.6,6816.5,7376.7,8096.5,8341.8,8587,9295.2,10013.6,10158.7,10263.2,11938,12110.7,12380.6,12900.1,13072.8,13210.7,13640.3,14107.6,14814.3]
{"loop":"kol-61-68","track":"https://soundcloud.com/koltercologne/symphony-no-5","bpm":127,"loopStartMs":114983.4,"loopEndMs":130101.3}
  cells: 1:amb 2:amb 3:Fm 4:amb 5:amb 6:amb 7:amb 8a:D 8b:amb
  onsets: []
  ambiguous: [743,2221.9,3287.1,4211.5,5160.6,5633.7,9565.2,12437.2]
{"loop":"kol-73-80","track":"https://soundcloud.com/koltercologne/symphony-no-5","bpm":127,"loopStartMs":137660,"loopEndMs":152778.1}
  cells: 1:amb 2:amb 3:amb 4a:amb 4b:Cm 5:amb 6:amb 7:Cm 8a:Cm 8b:amb
  onsets: []
  ambiguous: [43.5,120.5,223.5,293.2,590.7,690.8,790.9,989.8,1065.2,1169.7,1356.9,1425.1,1538.3,1642.8,1933.1,2008.5,2115.9,2182.7,2316.2,2480.2,2586.1,2790.7,2876.4,3126,3427.8,3530.9,3824,3902.4,3970.6,4072.2,4372.6,4543.9,4767.3,4847.2,4948.8,5266.6,5317.4,5421.9,5519.1,5622.1,5699,5790.5,5863,5963.2,6569.8,6654,7381,7597.3,7854.1,8151.7,8324.4,8546.4,8825,9096.4,9269.1,9489.7,9568.1,9878.6,9928,10216.8,10433,10514.3,10688.4,10862.6,11161.5,11383.6,11460.5,11760.9,12097.6,12707.1,13998.7,14648.9]
```

Cost: $0. Time: Fovos map 4.3 min, Kolter 5.1 min (one play each); 17–20 s to fill each loop; reads
0.51–0.99 s.

Not checked:
- By ear.
- Reader B.
- H3 as a graded rate: Kolter 61–68 bars 1–3 and Dubspinna 161–168 are the first real pads found.
  Their chord spans could be labelled for H3 in a later run.
- Hard Reset (preview only).
