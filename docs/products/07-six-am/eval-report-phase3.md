# Eval report: Six AM Phase 3, arrangement map, template and sounds (Founder v2, 25–26 Oct)

The PM's report of what the graders found (decisions 0026, 0028). Builders' opinions are not in
it. Graders: `user-tester` (2 runs, test sandbox only), one `design-critic` with the fixed
five-point scorecard, `data-evals` (references frozen before results). The owner-only checks are
the owner's and not here.

**Preview:** https://six-49p02na2b-mimirswell.vercel.app (behind Vercel login; uses the real
Supabase, so it's for the owner's review only) · **Branch:** `claude/07-six-am-arrangement-3746ad`

## Summary

| Eval | Bar | Result |
| --- | --- | --- |
| Riskiest assumption: a full track can be mapped in the browser from tab capture, measurements only | works end to end | **pass**: launched Chrome mapped real tracks with no clicks (Mason Flint 3:26, Kolter 5:04; 100% heard, ~1× track length) |
| X1 sections within 4 bars | ≥ 4 of 5 scored tracks | **fail, 0/5** first run (boundaries precise, median 0.1 s, but only 21/39 found). Re-run after one method change (L137): X1_RERUN |
| X2 template matches tempo, key, length, markers | exact | **pass** (user test: 126.1 BPM, Gm, 108 bars, markers 1/9/49/77/85, empty lanes; unit tests) |
| X3 synths in key and on tempo | 100% in scale, onsets ≤ 5 ms | **pass**: 1,829/1,829 bass notes and all chord tones in scale; every cleanly measurable onset ≤ 5 ms at A♯m 124, F♯ 122.4, Cm 128 (dense acid/reese lines: detector limit, worst 6 checked by hand at 0–0.5 ms) |
| X4 AI loops in key and on tempo | ≥ 4 of 5 | **pass, 4/5** with checked draws (L126); single draws 4/10, so the server checks each draw and retries up to 3 times. Partly circular: the check and the grade share Ears' tempo estimator. #5 (145 BPM) fails as half time, likely an estimator limit |
| X5 AI cost shown = real usage | within a cent | **pass, exact**: $0.64 shown = 64 Stability credits for 8 draws |
| X6 user test: every job ≥ 4 | all ≥ 4 | **pass on re-check**: 5 / 4 / 5 / 4 / 4 (first run 4 / 2 / 5 / 4 / 3) |
| X7 design scorecard (target 9, not a blocker) | 9/10 | **map 9/10** (7 → 8 → 9); **sound drawer 8/10** (6 → 8 → 8, rounds stopped when the score stopped moving) |
| X8 no streamed audio stored or uploaded | 0 | **pass**: during a 3:36 listen only `PUT /api/analyses` (1.7 KB) and `/api/maps` (4 KB) JSON; a stopped listen sends nothing |
| AI keys server-side only | 0 in the bundle | **pass**: 0 hits in 13.1 MB of JS or any response; loop and map routes 401 without the code |
| Build hygiene | lint, test, build | **pass** (230 tests); `checks` on the PR |

## Requirements A1–A11

| # | Result | Evidence |
| --- | --- | --- |
| A1 full-track listen, measurements only | pass | network in the user test (X8); PCM in ~0.5 s pieces → 11 numbers per frame, dropped |
| A2 sections on the bar grid | partial | shown and clickable (user test job 1 = 5), but X1 accuracy fails (see above) |
| A3 layer estimates labelled | pass | one estimate line + "(estimate)" in every read-out; solid = likely, hatched = maybe |
| A4 Mentor explains the structure | pass (user test 4/5) | teaches what a breakdown does; ranges match the map's blocks (T70) |
| A5 one click to a template | pass | X2 |
| A6 bass and chord synths, 3 knobs, in key and on tempo | pass | X3; user test job 4 = 4 |
| A7 Mentor explains the knobs | pass | short question in the history, knob guide as hidden context; knows the Studio has no automation |
| A8 909/808 kits, licences recorded | pass | `public/kits/LICENSES.md`; 4 of 8 Freesound pages checked by data-evals: CC0 |
| A9 AI bass loop like this track, cost shown | pass | X4, X5; user test job 5 = 4; never overwrites, "Your loops", worst case shown before |
| A10 Stable Audio vs Lyria bake-off recorded | pass | `evals-runs/2026-10-25-ai-loops-bakeoff.md` and `-grading.md`; Stable Audio 2.5 won (L124), Lyria opt-in only (L125), Stable Audio 3.0 dropped |
| A11 AI keys server-side, routes behind the code | pass | bundle grep + 401s |

## AI service bake-off (L102, A10)

| Service | Tempo ±1 | Key | Median time | Cost / loop | Output |
| --- | --- | --- | --- | --- | --- |
| Stable Audio 2.5 (winner) | 5/5 | 2/5 raw → 4/5 with checked draws | 3.5 s | $0.08 (avg $0.128 with retries) | WAV, trimmed to the exact bar length, seam crossfaded |
| Lyria 3 Clip (opt-in fallback) | 5/5 | 2/5 | 13.2 s | $0.04 | MP3, always 30 s |
| Stable Audio 3.0 (dropped) | 0/5 | 3/5 | 3.3 s | $0.08 | WAV |

Neither API takes a tempo or key parameter (prompt only; Lyria RealTime does, but is experimental
with no published price).

## Design

All 10 rough directions (owner's pick: **1 Studio**, L114; PM's earlier pick 1, 3, 7 replaced):
contact sheet `design/map-directions.html`, screenshots `design/map/map-01-studio.png` …
`map-10-record.png` (Studio, Ledger, Liner notes, Phrase grid, Timetable, Skyline, Wall label,
Vertical, Score, Record). Built screens: `design/built/`, `design/drawer/`.

| Screen | Rounds | Final scorecard | Open points |
| --- | --- | --- | --- |
| Map | 7 → 8 → 9 | clutter 2 · hierarchy 1 · legibility 2 · feel 2 · copy 2 | the gold "Start a track from this" (kept as the one gold primary, T56; owner may veto) |
| Sound drawer | 6 → 8 → 8 | clutter 1 · hierarchy 2 · legibility 2 · feel 2 · copy 1 | AI column copy; the critic wanted "Your loops" removed, kept because the user test asked for it (F2) |

## User test (test sandbox only)

First run (`user-testing/report-2026-10-26-phase3.md`): 4 / 2 / 5 / 4 / 3. Majors fixed: AI loop
overwrote and replaced, cost surprise, Explain recited numbers. Re-check
(`report-2026-10-26-phase3-recheck.md`): 5 / 4 / 5 / 4 / 4; new minors N1–N4 fixed after it
(T72, not re-tested). **Caveat:** the re-check ran with the Mac's screen locked, so no real tab
capture: it used a map rebuilt from the earlier real listen. Nobody has listened to the synths,
kits or AI loops by ear: that's the owner's.

## Guardrails

| Guardrail | Result |
| --- | --- |
| No streamed audio stored, uploaded or sent anywhere | 0 (X8) |
| AI keys in the bundle or responses | 0 |
| Ears, the Mentor and the Studio unbroken | yes; a seeded saved track byte-identical after the template work |
| Readable text ≥ 4.5:1, hit areas ≥ 28 px | Phase 3 text ≥ 5.27:1, controls ≥ 28 px; the Studio ruler numbers (2.40:1) and units (3.59:1) predate Phase 3 |

## Cost of the phase (estimates)

| Item | Cost |
| --- | --- |
| AI loops (Stability; bake-off, fix runs, user tests, builders' checks) | ~$3.76 |
| Mentor calls (builders, user tests) | ~$0.15 |
| Claude for the squad and PM (≈ 900 agent turns on Opus 5.5 plus the critic; mostly cache reads at $0.20/M, output at $20/M) | roughly $100–150 (rough estimate from turn counts; the monthly limit was hit once around 01:30) |

## What was skipped or is weak

- **X1 fails** on the scored backup set; section detection finds too few boundaries, labels are
  sometimes inverted, and results vary between captures of the same track. None of the 10 owner
  validation tracks had public section times; V2–V3 were mapped and listed, V4–V10 not run.
- The re-check had no real full-track listen (screen locked); N1–N4 fixes not re-tested.
- Synth and kit "Add to lane" still overwrites (AI loops don't).
- Try reasons for AI loops aren't stored (shown once).
- Section-click playback (F6) checked from screen and network only.
- One Tone Transport tick slip (≤ 3.5 ms at 90 BPM) in the render path (backlog).

## Decision log

L100–L137 and T49–T72 in `decisions.md` (owner calls L100–L106, L110, L111, L114).
