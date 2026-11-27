# Chords in Make, slices 1–2: the app's own behaviour, 26 Nov 2026 (data-evals)

This grades H6–H11, H14 and H16 on the built slices 1 and 2, the evals the app's own behaviour
decides, at 42ada83. I graded only and changed no product code.

**Result.** H6, H7, H8, H10, H11, H14 and H16 pass. **H9 passes in Make (5/5) but fails on the
saved sound for 2 of 5:** two hits inside one 16th collapse into one when the row is folded for
saving (S-1), so the Studio would play one chord fewer than Make on Lost 69–76.

## Setup

- **Copy:** a detached worktree of 42ada83 in my scratchpad (`grade-wt`), with its own
  `pnpm install`. Nothing was built or served from the main folder or the tester's copy.
- **Server:** production (`next build`, then `next start -p 3037`) with `SIXAM_MEMORY_STORE=1`, the
  empty Supabase env, `ACCESS_CODE=test-code`, and `ANTHROPIC_API_KEY` and `STABILITY_API_KEY` empty
  (no paid calls). It reported `store: "memory"`.
- **Maps:** seeded with `sandbox-seed.mjs --base :3037`, plus the Dubspinna and Kolter maps from
  today's measured values.
- **Chrome:** my own (fresh profile, Deck auto-select). Pages opened as
  `/map?id=…&mode=make&make=melody&plant=1&quiet=1`; every loop was separated live.
- **Network:** a CDP logger auto-attached to every page, iframe and worker for the whole run.
- **Loops:**
  - Lost 69–76 (G7 stabs).
  - Dubspinna 57–64 (plucks).
  - Kolter 61–68 (pads, Held).
  - Lost 85–92 for the Bass/Drums/FX smoke check.
- **Hooks used:** `makeChords()`, `chordsDo`, `plantChord`, `melody()`, `melodyDo`,
  `compareLevels`, `chordsRead("dsp")`.
- **C2:** only numbers and names were kept, and they were deleted after grading.

## Results

| Eval | Bar | Measured | Result |
| --- | --- | --- | --- |
| **H6** every played note in its chord, on time | 100 % of notes from the cell's chord; onsets ≤ 5 ms of the read time | `makeChords().played` against `chordsRead("dsp")` events. **Notes:** 297/297 in their cell's chord (Lost 124/124, Dubspinna 156/156, Kolter 17/17); every event plays all its chord's tones (87/87). **Times:** 87/87 events at 0.0 ms from a read event (Lost 31/31, Dubspinna 51/51, Kolter 5/5; Kolter's 5 all held). The poly synth's render timing is unchanged since Phase 5 (Z4: ≤ 4.2 ms), and its source is untouched | **Pass** |
| **H7** A/B level-matched, Chords | within 1 dB (LUFS), drums under both on by default | The product's `compareLevels(2)`, A (the original "other") against B (Mine): Lost −20.05 / −20.05, Dubspinna −20.19 / −20.19, Kolter −18.07 / −18.07 LUFS (0.00 LU) at the preset and again after the ticks. The bed (original drums) is on by default on all 3. No independent live tap this time | **Pass** (product measure) |
| **H8** Suggest closer than the preset | distance drops on ≥ 3 of 5 loops per row | Chords row, the product's distance after applying the gold ticks: Lost 12.25 → 6.24, Dubspinna 17.44 → 15.61, Kolter 36.42 → 8.59 (scores 22 → 46, 11 → 14, 1 → 34). **3/3 loops** (only 3 loops in this run) | **Pass** (3 of 3) |
| **H9** edits survive save and reload | 5 of 5, rendering identical | 5 saves, each with a chord pick, a note edit, and a moved hit or the "short" timing preset; 2 of them on the Pad preset. **After a page reload, re-separation and loading the sound from the menu: 5/5** come back in Make (names, notes, and edited hits by place). The stored pattern is byte-identical after the reload (5/5). **Saved notes against what Make played: 3/5 identical; Lost a2 and b keep 124 of 128 notes (S-1)** | **Partial**: edits 5/5; saved rendering 3/5 |
| **H10** nothing else broke | Bass, Drums, FX and Phase 5 melody render sample for sample; Z7/Z8 pass | `pnpm -F 07-six-am test`: **547/547**, including `bass-golden` (hashes as before Phase 5) and the drums' sample-for-sample test. The render sources (poly, FX, drums and bass synths) are unchanged since the Phase 6 base 55e3e9e; `notes-read.ts` and `melody-make.ts` only moved or exported code. Live smoke on Lost 85–92: Bass, Drums and FX all ready in 2.7–2.9 s, Bass and Drums A/B 0.00 LU, a drum row and an FX row saved | **Pass** |
| **H11** zero bytes of the original stored or sent | 0 | **Network:** 3,773 requests from every page, iframe and worker; 194 had a body, and none was binary. Bodies went only to `PUT /api/maps` (≤ 13.5 KB; the longest numeric array is 235, the map's per-bar levels), `POST /api/sounds` (≤ 9.7 KB, longest numeric array 6) and SoundCloud's own widget telemetry (no arrays). No WebSocket frames. **Storage:** localStorage holds only the access code; IndexedDB and OPFS are empty; Cache Storage holds only the separation model | **Pass** (0) |
| **H14** fixing is quick | a planted wrong chord fixed in ≤ 3 taps when the right one is offered | `plantChord` on bar 2 of each loop (G7 → F♯, C♯maj7 → F♯, Cm → F♯). The tile shows the planted chord; **open the bar (1) + pick the right card (2) = 2 taps** on 3/3. The right chord was among the first cards each time, and the bar's name then reads right | **Pass** (hook count; the tester measures by hand) |
| **H16** Make comes alive quickly | chords read ≤ 3 s after the loop is in memory; knobs live ≤ 35 s on 8-bar loops | **Read ready** 0.57 / 0.74 / 1.04 s after the loop is in memory (worker read 0.54 / 0.66 / 1.01 s); `chordsRead` 0.50–0.99 s. **Mine ready** 0.88–1.25 s after memory, so knobs are live about 21 s after setting an 8-bar loop (fill 20.2–20.4 s) | **Pass** |

## Failures

**S-1. Two hits in one 16th become one in the saved sound.**
- Lost 69–76 bar 8 has two stabs on step 120: one at 14,588 ms (35 ms long, 0.36 of a 16th early)
  and one at 14,623 ms.
- Make plays both. `foldMelodyRow` keys notes by `step:midi`, so the saved pattern keeps one: 124 of
  128 notes.
- The Studio and a reload would play 30 chords where Make played 31. Editing is not involved; any
  save of a loop with a flam in one 16th does this. It showed on 2 of 5 saves.
- Likely fix: keep both, or merge them on purpose; at least make the save match what Mine plays.
- Repro: Lost 69–76 in Melody, save the chords row. Then compare `makeChords().played` (31 events)
  with the saved sound's `pattern.notes` (31 × 4 − 4).

**Observation (not a fault):** a name-only pick keeps the read's own hit times. After a reload the
loop is re-separated, and the reader can place a bar's first stab slightly differently: Lost bar 1
read a hit at 325 ms in one copy and at 0 ms in the next. So "rendering identical" only holds for
what was edited (names, notes, edited times), or for the saved sound itself, not for un-edited
times read from a new copy.

**Grader note:** `chordsDo.reset()` on a bar that was planted returns it to the planted chord, not to
Make's own guess. That only matters to graders; `plantChord` is dev or `?plant=1` only.

## What wasn't checked

- By ear.
- The Studio lane drop for these saves: the saved pattern and lane rules are unchanged since
  Phase 5's Z7.
- The Lead row (slice 4).
- H8 on 5 loops (3 here).
- H7 with an independent loudness tap.
- H14 by hand (the tester).

Cost: $0. Time: build about 1.5 min; each loop filled in 20 s; every read under 1.1 s.
