# Chords: reader A round 2 (c67c631), 26 Nov 2026 (data-evals)

This re-grades reader A after c67c631 (T178–T180). The round decides "held" per cell, starts a held
cell at its line, fixes a chord that came back with no event, and makes a second try at U-2. I
graded only and changed no product code.

**Verdict.**
- **N-1 is fixed:** every chord change on the two pad loops starts at its line.
- **H3 improved but still fails:** 64 % (7/11, was 18 %). Kolter passes 4/4; Dubspinna 161–168
  passes 3/7.
- **H2 holds:** 98.5 % found, 8.1 % extra. Only 3 of 215 struck stabs were turned held, and none
  on Lost 49–56 or 69–76.
- **U-2 is not fixed:** the same 2 of 4 F minor cells are wrong.
- **H1 pooled dipped slightly but passes:** 82.5 % / 87.0 %. H5 passes at 93.7 %.
- **The held-out loop is unchanged:** 25 % / 50 %, and its H5 dropped to 50 %.
- **CH-7 improved:** Gdim cells went from 5 to 3.

## Setup

- **Build:** the separate worktree `scratchpad/reader-wt`, detached at c67c631, as a production
  build (`next build`, then `next start -p 3037`) with `SIXAM_MEMORY_STORE=1`, the empty Supabase
  env, `ACCESS_CODE=test-code`, and the AI keys empty (no paid calls possible). The server reported
  `store: "memory"`.
- **Maps:** seeded with `sandbox-seed.mjs --base :3037`, plus the Retrouvé, Dubspinna and Kolter
  maps from today's measured values.
- **Reads:** my own Chrome (fresh profile, Deck auto-select, `?quiet=1`). 14 loops were separated
  live and read twice each with `chordsRead("dsp")`; both reads were identical on every loop.
- **Labels:** the same blind labels as `2026-11-26-chords-slice1-reader.md` (the spike and unseen
  fixture blocks plus the 11 H3 spans listed there), unchanged. Same scoring rules.
- **C2:** numbers only, deleted after scoring.

## Before and after

| Eval | Bar | Round 1 (d35fae4) | Round 2 (c67c631) | Result |
| --- | --- | --- | --- | --- |
| **H3** held chords stay held | ≥ 80 % | 18 % (2/11): Kolter 2/4, Dubspinna 0/7 | **64 % (7/11)**: Kolter **4/4**, Dubspinna **3/7** | **Fail** (better) |
| **N-1** pad chord changes start at the line (within 80 ms) | all | 4 of 7 Dubspinna changes ~0.7 s late | **11/11 on time** (7 Dubspinna at the cell line 960, 2880, 6720, 8640, 10560, 14373 ms; 4 Kolter) | **Fixed** |
| **H2**, spike struck loops + Dubspinna 33–40 | ≥ 90 % found, ≤ 15 % extra | 99.0 % / 6.5 % | **98.5 % / 8.1 %** (194/197; 32/395) | Pass |
| H2, the same + held out 73–80 | as above | – | **98.6 % / 7.6 %** (212/215; 33/432) | Pass |
| Struck stabs turned held | 0 | – | **3 of 215** (one each on Dubspinna 141–148, 33–40, 73–80); **Lost 69–76 0/28, Lost 49–56 0/4**; 3 stabs missing (Retrouvé 57–64: 2, 113–120: 1) | Ok |
| **U-2** Dubspinna 33–40 | Fm right | 2/4 | **2/4**, same misses (3b B♭sus2, 4b C♯maj7); 7b now Fm | **Not fixed** |
| H1 root + family, pooled 13 | ≥ 70 % | 84.9 % | **82.5 %** (52/63) (spike 9: 81.6 %, unseen 4: 84.0 %) | Pass |
| H1 root, pooled 13 | ≥ 80 % | 89.1 % | **87.0 %** (60/69) | Pass |
| H5, pooled 13 | ≥ 90 % | 92.1 % | **93.7 %** (59/63) | Pass |
| Held out Dubspinna 73–80: H1 / root / H5 / H2 | | 25 % / 50 % / 75 % / 100 / 5.3 % | **25 % / 50 % / 50 % / 100 / 2.7 %** | H1 and H5 fail |
| **CH-7** Gdim cells, Dubspinna 57–64 / 105–112 / 73–80 | 0 | 5 (1 / 1 / 3) | **3** (1 / 1 / 1); labelled cells still Gdim: 105–112 4a, held-out 8a | Better, not gone |
| H16 read time | ≤ 3 s | 0.39–0.98 s | **0.43–1.03 s** (28/28) | Pass |

### Per loop (round 2)

| Loop | H1 root + family | Root | H5 | H2 found / extra | H3 |
| --- | --- | --- | --- | --- | --- |
| Lost 69–76 | 100 % (7) | 100 % | 100 % | 100 / 6.3 % | |
| Lost 77–84 | 100 % (5) | 100 % | 100 % | 100 / 13.6 % | |
| Lost 49–56 | 80 % (5) | 80 % | 80 % | 100 / 10.0 % | |
| Retrouvé 57–64 | 62.5 % (4) | 62.5 % | 50 % | **84.6 / 20.6 %** | |
| Retrouvé 89–96 | – | – | – | 100 / 10.2 % | |
| Retrouvé 113–120 | – | 100 % (4) | – | 94.1 / 10.7 % | |
| Dubspinna 57–64 | 70 % (5) | 70 % | 100 % | 100 / 3.8 % | |
| Dubspinna 141–148 | 87.5 % (8) | 90 % | 87.5 % | 100 / 0 % | |
| Dubspinna 105–112 | 50 % (4) | 75 % | 100 % | 100 / 4.9 % | |
| Dubspinna 33–40 | 50 % (6) | 66.7 % | 100 % | 100 / 7.5 % | |
| Dubspinna 161–168 | 92.9 % (14) | 92.9 % | 100 % | 1 onset; 16 events | **3/7** |
| Kolter 61–68 | 100 % (2) | 100 % | 100 % | no chord onset; 6 events | **4/4** |
| Kolter 73–80 | 100 % (3) | 100 % | 100 % | no chord onset; 4 events | |
| **Dubspinna 73–80 (held out)** | 25 % (4) | 50 % | 50 % | 100 / 2.7 % | |

## Failures

- **H3 on Dubspinna 161–168, 4 of 7 held chords break.** Each starts on time, then:
  - B♭m [2840, 4520] is held for one cell (960 ms), then re-struck at 4040 on a soft swell, then at 4516 (the real stab).
  - E♭ [8597, 10518] is split into B♭sus4 (8640) and E♭ (9600): the same notes, but the first cell's root moved, so it sounds as a second chord.
  - B♭m [10518, 12200] is held one cell, then struck at 11720 and 12193.
  - D♭ [14366, 15360] is struck three times as C♯maj7 (14373, 15087, 15209).

  Kolter's pads are now one held event per chord (6 events for the loop, was 15).
  Repro: Dubspinna, `setLoop(308291, 323651)`, then `chordsRead("dsp")`, then `events`.
- **E♭ ↔ B♭sus4 (new spot).** Dubspinna 161–168 5b now reads B♭sus4 (was E♭); 141–148 1b still
  does. E♭ with F and B♭ (E♭sus2) is the same note set as B♭sus4, and the root goes to B♭.
- **U-2 not fixed.** Dubspinna 33–40: bar 3b still reads B♭sus2, and 4b still C♯maj7.
- **Retrouvé 57–64 H2 dipped:** 2 of 13 stabs are missing and extra is 20.6 %, against 100 / 11.4 % in
  round 1. The pooled H2 still passes.
- **7ths on triads:** Dubspinna 57–64 bars 3 and 4a read B♭m7 (family right). Across the Dubspinna
  loops, E♭7 and A♭maj7 still appear on ambiguous or B♭m bars (6 cells).

## What wasn't checked

- By ear.
- Reader B.
- H4.
- H3 beyond these two pad loops.

Cost: $0. Time: build about 1.5 min; 17–20 s to fill each loop; reads 0.43–1.03 s. The server and
Chrome were stopped afterwards.
