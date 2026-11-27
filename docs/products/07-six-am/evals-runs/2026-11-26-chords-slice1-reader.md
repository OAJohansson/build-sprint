# Chords: reader A after the U-1, U-2, CH-7 fixes, 26 Nov 2026 (data-evals)

This re-grades reader A (DSP) on real tracks after commit d35fae4 (T168–T171), which addressed:
- **U-1:** an onset needs a strike-shaped rise, and pump dips are bridged.
- **U-2:** sus and dim rank under another root's triad on near ties.
- **CH-7:** strike weight needs 2+ notes rising together, and a lead over quieter notes is never the
  low note.

I graded only and changed no product code. The builder's fixture numbers are not used here.

**Verdict.**
- **H3 fails:** 2 of 11 held chords stay held (18 %).
- **U-2 is not fixed:** 2 of 4 F minor cells on Dubspinna 33–40 are still wrong, the same 2 as before.
- **H2 holds:** 99.0 % found, 6.5 % extra.
- **H1 and H5 pooled improved and pass:** root + family 84.9 %, root 89.1 %, H5 92.1 %.
- **The held-out loop is unchanged:** 1 of 4 on type, 2 of 4 on root.
- **CH-7 is partly fixed:** Gdim cells on Dubspinna fell from 8 to 5, but the held-out loop still reads
  bars 4a and 8a as Gdim.
- **New failure N-1:** a chord change on a soft pad starts about 0.7 s late.

## Setup

- **Build:** a production build of d35fae4 (`next build`, then `next start -p 3017`), so the other
  engineer's edits couldn't reload the page. Graders need `SIXAM_MEMORY_STORE=1` with the empty
  Supabase env for a production server to use the in-memory sandbox (`store.ts`); I checked that the
  server reported `store: "memory"`.
- **Sandbox:** `ACCESS_CODE=test-code`, `ANTHROPIC_API_KEY` and `STABILITY_API_KEY` empty (no paid
  calls possible), seeded with `sandbox-seed.mjs`. Retrouvé, Dubspinna and Kolter maps were seeded
  with the values measured earlier today.
- **Chrome:** my own (fresh profile, Deck auto-select, `?quiet=1`).
- **Reads:** 14 loops, each separated live and read with `chordsRead("dsp")` twice. Both reads were
  identical on every loop.
- **Labels:** the blind labels from `2026-11-26-chords-spike.md` and `2026-11-26-chords-unseen.md`,
  unchanged, plus new H3 spans (below).
- **C2:** numbers only (semitone spectrogram and band envelopes of the copy at "chords-read"),
  deleted after scoring.

**Dubspinna 33–40 is no longer unseen.** The engineer worked from its U-2 failure description, so
the "unseen" column below is a check on that loop's fault, not a generalisation test.

### H3 labels (held chords)

I labelled these from this run's spectrogram and 100–1200 Hz band. A held span is one chord sounding
≥ 1.5 beats with no strong (chord-class) onset inside. Soft swells and sidechain dips are inside it.

- **Kolter 61–68:**
  - [0, 3779] ms: the E♭/Fm pad, bars 1–2.
  - [3779, 5669]: Fm, bar 3.
  - [6614, 9449]: a held B♭–G dyad, bars 4b–5.
  - [13228, 15118]: D major, bar 8.
- **Dubspinna 161–168:**
  - D♭ [0, 917], E♭ [917, 2840], B♭m [2840, 4520] (a real stab at 4520 ends it).
  - D♭ [6684, 8597], E♭ [8597, 10518], B♭m [10518, 12200], D♭ [14366, 15360].
  - The chord changes fall on beat 3, matching the half-bar name labels.

A span passes when one held event starts within 80 ms of the span start, lasts ≥ 80 % of the span,
and no other event starts inside it (more than 80 ms from either end).

## Results

| Eval | Bar | Previous grade | Now (d35fae4) | Result |
| --- | --- | --- | --- | --- |
| **H3** held chords stay held | ≥ 80 % | not graded (U-1: Kolter 61–68 had 60 struck events, Dubspinna 161–168 had 22 events for 1 onset) | **18 % (2/11)**: Kolter 2/4, Dubspinna 0/7. Events fell to 15 (Kolter) and 17 (Dubspinna) | **Fail** |
| **U-2** on Dubspinna 33–40 (not unseen any more) | Fm cells right | 2/4 (3b B♭sus2, 4b C♯maj7) | **2/4**, the same 2 wrong (3b B♭sus2, 4b C♯maj7); 6b and 7b now Fm7 (family right) | **Not fixed** |
| **H2**, spike struck loops + Dubspinna 33–40 | ≥ 90 % found, ≤ 15 % extra | 98.9 / 11.8 % (spike 9); 100 / 4.8 % (33–40) | **99.0 % found, 6.5 % extra** (195/197; 25/387); best shifts −8 to +8 ms | **Pass** |
| H1 root + family, pooled 13 loops | ≥ 70 % | spike 9: 80.3 %; unseen 4: 88.0 % | **84.9 %** (53.5/63); spike 9: 82.9 %; unseen 4: 88.0 % | **Pass** |
| H1 root, pooled 13 | ≥ 80 % | 85.2 %; 92.0 % | **89.1 %** (61.5/69); spike 9: 87.5 %; unseen 4: 92.0 % | **Pass** |
| H5, pooled 13 | ≥ 90 % | 89.5 %; 96.0 % | **92.1 %** (58/63); spike 9: 92.1 %; unseen 4: 92.0 % | **Pass** |
| H1, held out (Dubspinna 73–80) | ≥ 70 % / 80 % | 25 % / 50 % (re-grade), 0 % / 50 % (unseen run) | **25 % / 50 %** (1/4, 2/4) | **Fail** |
| H5, held out | ≥ 90 % | 50 % | **75 %** (3/4) | Fail |
| H2, held out | as H2 | 100 / 12.2 %, 100 / 12.8 % | **100 / 5.3 %** | Pass |
| **CH-7** Gdim cells on Dubspinna 57–64, 105–112, 73–80 | 0 | 8 (57–64: 1, 105–112: 3, 73–80: 3) | **5** (57–64: 1, 105–112: 1, 73–80: 3); on labelled cells the held-out 4a and 8a are still Gdim; 105–112 4a moved from Gdim to **E♭7** (still wrong) | Partly fixed |
| H16 read time | ≤ 3 s | 0.38–0.99 s | **0.39–0.98 s** (28/28) | Pass |

### Per loop (reader A, now)

| Loop | H1 root + family | H1 root | H5 | H2 found / extra (shift) | H3 |
| --- | --- | --- | --- | --- | --- |
| Lost 69–76 | 100 % (7) | 100 % | 100 % | 96.4 / 6.7 % (+1 ms) | |
| Lost 77–84 | 100 % (5) | 100 % | 100 % | 100 / 17.4 % (+7 ms) | |
| Lost 49–56 | 80 % (5) | 80 % | 80 % | 100 / 20.0 % (4 onsets, 10 events) | |
| Retrouvé 57–64 | 50 % (4) | 50 % | 50 % | 100 / 11.4 % (−8 ms) | |
| Retrouvé 89–96 | – | – | – | 100 / 3.7 % | |
| Retrouvé 113–120 | – (root only) | 100 % (4) | – | 94.1 / 13.5 % (+8 ms) | |
| Dubspinna 57–64 | 70 % (5) | 70 % | 100 % | 100 / 5.9 % | |
| Dubspinna 141–148 | 100 % (8) | 100 % (10) | 100 % | 100 / 0 % | |
| Dubspinna 105–112 | 50 % (4) | 75 % | 100 % | 100 / 0 % | |
| Dubspinna 33–40 | 50 % (6) | 66.7 % | 66.7 % | 100 / 2.5 % | |
| Dubspinna 161–168 | 100 % (14) | 100 % | 100 % | 1 onset; 4 of 17 events extra | **0/7** |
| Kolter 61–68 | 100 % (2) | 100 % | 100 % | no chord onset; 15 events | **2/4** |
| Kolter 73–80 | 100 % (3) | 100 % | 100 % | no chord onset; 18 events | |
| **Dubspinna 73–80 (held out)** | 25 % (4) | 50 % | 75 % | 100 / 5.3 % | |

## Failures

- **H3 (U-1 continued): held pads are still re-struck.**
  - Dubspinna 161–168 plays its 7 held chords with 17 events: 1–3 re-strikes per chord on the pad's
    swells and pump (for example D♭ at 194 and 682 ms, D♭ again at 7407, 7877 and 8362).
  - Kolter 61–68 bars 1–2 (one pad, 3.8 s) are re-struck 7 times (1326, 1457, 1558, 1797, 3204,
    3463, 3692 ms).
  - Kolter's later held spans pass: the B♭–G dyad is one 3.8 s event, D one 1.9 s event.
  - Repro: Dubspinna, `setLoop(308291, 323651)`, then `chordsRead("dsp")`, then `events`.
- **N-1 (new, or not seen before): on a soft pad, a chord change starts late.**
  - When a cell has an onset somewhere after its start, it gets no event at its start. The new chord
    then sounds only from that later onset, and the previous one is cut at the cell line.
  - Dubspinna 161–168, 4 of 7 changes:
    - E♭ due at 960 ms starts at 1643.
    - D♭ due at 6720 starts at 7407.
    - E♭ due at 8640 starts at 9326.
    - D♭ due at 14400 starts at 15087.
  - Between the cell line and that onset, Mine plays nothing.
  - Likely cause: the stricter strike shape (T168) rejects the soft change itself while a later
    swell still passes, and `eventsFromOnsets` only adds a start event to cells with no onset.
- **U-2 not fixed.** Dubspinna 33–40 bar 3b (F A♭ C G after B♭m) still reads B♭sus2, and 4b still
  reads C♯maj7.
- **CH-7 and false 7ths.**
  - Held out 73–80: bars 4a and 8a are still Gdim, and bar 1 reads E♭7.
  - Dubspinna 105–112: bar 4a (B♭m) now reads E♭7, and bar 5 E♭7.
  - Across the Dubspinna loops: 10 maj7 cells (6 C♯maj7, 4 A♭maj7) and 3 E♭7 cells where my labels have
    triads or ambiguous bars. On the typed cells, the family is still right for D♭ → C♯maj7.

## What wasn't checked

- By ear.
- Reader B.
- H4.
- Whether N-1 was already there before d35fae4: I didn't inspect event starts on this loop in the
  unseen run.
- H3 on more pad loops: these two are the only real pads found so far.

Cost: $0. Time: production build about 1.5 min; 17–20 s to fill each loop; reads 0.39–0.98 s.
