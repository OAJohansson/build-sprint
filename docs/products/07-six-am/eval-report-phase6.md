# Eval report: Six AM Phase 6, Chords and lead in Make (26 Nov)

Founder mode v2. Graders never built what they graded. Sandbox only (`ACCESS_CODE=test-code`,
in-memory store, AI keys empty, $0 in paid calls). Owner-only checks (by ear) are in the final
review, not here.

## What ships

- **Make guesses the chords (slice 1).** The Melody tab is on. Reader A, in the browser, names
  a chord for each bar or half bar of the looped "other" part. Mine plays those chords on your poly
  synth at the read times. Each bar's tile shows a "?" when Make isn't sure.
- **The listening panel (slice 1).** It is always open. It has a Track reference button and chord
  cards: one tap hears a card and uses it. It also has "All N X bars" (grouped by Make's guess)
  and More chords.
- **Fix it by ear (slice 2).**
  - The Piano view adds or removes notes and shows the closest name ("≈ G").
  - Timing works on the 16ths: Short hits or Held, drag, arrow keys, and Earlier, Later, Shorter,
    Longer, Remove.
  - Reset follows "All N bars".
  - The closeness score counts pitch and timing.
  - Edits save and come back exactly.
- **Why it fits (slice 3).** The theory facts come from code (`chord-facts.ts`, tested). The Mentor
  writes the words; when it's offline, Six AM gives its own two plain sentences.
- **Studio (slice 3).** Chords sounds land on the Chords or Pads lane. The drawer names each bar;
  across keys it reads "C7 · was G7".
- **Lead (slice 4).** The Basic Pitch lead line goes on a note grid in the song's key, with
  "Notes outside the key". It switches off when it's really the chords or sits too low, as on Lost
  69–76. Mason's riff stays on.
- **Not shipping:** a reader that holds pads reliably (H3, see below); vocals; a phone layout for
  the Lab.

## Agent-checkable evals (H1–H16)

| # | Eval | Bar | Result | Verdict |
| --- | --- | --- | --- | --- |
| H1 | Chord names | ≥ 70 % root + family, root ≥ 80 % | 82.5 % / 87.0 % pooled on 13 real loops (spike 36.8 %); held-out loop 25 % / 50 % | pass pooled, held-out fails |
| H2 | Chord times | ≥ 90 % found within 30 ms, ≤ 15 % extra | 98.5 % / 8.1 % | pass |
| H3 | Held chords stay held | ≥ 80 % | 64 % (7/11; was 18 %). Hand fix: the "Held" preset (L263) | **fail** |
| H4 | Lead notes (reported) | ≥ 70 % found, ≤ 20 % wrong | Mason 72 % / 36 % wrong; Dubspinna 100 % / 68 % wrong | reported; wrong-note target missed |
| H5 | Right chord one tap away | ≥ 90 % | 93.7 % | pass |
| H6 | Played notes in chord, on time | 100 %, ≤ 5 ms | 297/297 in chord; 87/87 at 0.0 ms | pass |
| H7 | A/B level-matched | ≤ 1 dB | 0.00 LU, 3/3 loops | pass |
| H8 | Suggest closer | ≥ 3 of 5 loops | 3/3 run | pass (3 loops) |
| H9 | Edits survive save and reload | 5/5 | chords 5/5 (after S-1); lead 4/4 saved, timing kept on load (after LD-1) | pass |
| H10 | Nothing else broke | golden hashes | 603/603 tests incl. bass golden and drums sample-for-sample | pass |
| H11 | 0 bytes of the original | 0 | 0 across 4,811 + 3,773 requests and storage | pass |
| H12 | Mentor theory facts | 20 pairs | 36 pairs: numeral, key and role 36/36; spelling 35/36 (E♭dim's fifth, TH-4, backlog) | pass |
| H13 | User test per job | ≥ 4/5 | fix a planted chord 4 · edit a note 4 · move a chord 4 · Why it fits 4 · Studio 4 · lead 4 | pass |
| H14 | Fixing is quick | ≤ 3 taps | 3 taps by hand, 2 by hook | pass |
| H15 | Design scorecard | 9 target | round 5 prototype 9/10; built screen: see the critic's line below | see below |
| H16 | Comes alive quickly | read ≤ 3 s; knobs ≤ 35 s | chords 0.4–1.0 s, lead 1.1–1.4 s; knobs ~21 s on 8 bars | pass |

**Critic, built screen:** 7/10 first build, 8/10 after polish (clutter 1 · hierarchy 2 · legibility 1 · feel 2 · copy 2); later clipping fixes checked by the tester, not re-scored.

## Guardrails

- The original is never stored or sent (H11: 0 bytes).
- No AI key ships in the bundle. The Mentor gets names and numbers only.
- Bass, Drums, FX, the Studio and Phase 5 sounds are unbroken (H10).
- Graders never touched the owner's data.

## Decision log (this phase)

L248–L264 and T145–T218 are in `decisions.md`. The PM calls made while the owner was away:

| # | Call |
| --- | --- |
| L262 | The canvas was signed off with a simplification pass, then 9/10. |
| L263 | "Held" is the hand fix for pads the reader re-strikes. |
| L264 | The Studio names chords in the track's key, with "was G7" beside them. |

Reader rounds:
- The two time-boxed reader rounds were kept because they were better than the spike.
- D♯ minor is spelled E♭ minor, the same as the key label (T218; a one-line change).

## What I skipped or couldn't check

- Nothing was judged by ear. Whether the chords sound like the track is the owner's call.
- The live Mentor answer can't be checked until the API limit resets on 1 Dec. Offline answers
  were checked.
- No phone check: the Lab has no narrow layout (backlog).
- H8 ran on 3 loops, not 5.
- U-2 (Fm misread), the false 7ths and CH-7 on the held-out loop are in the backlog. The lead's
  chord-notes guard reads low live (it passed through the "too low" guard instead; backlog).

## Evidence

- Reader grades in `evals-runs/`:
  - `2026-11-26-chords-spike.md`
  - `2026-11-26-chords-unseen.md`
  - `2026-11-26-chords-slice1-reader.md`
  - `2026-11-26-chords-slice1-reader-r2.md`
- Product grades in `evals-runs/`:
  - `2026-11-26-chords-slices1-2.md`
  - `2026-11-26-chords-final.md`
- User tests: `user-testing/report-2026-11-26-chords-slice1.md`, `-slice2.md`, `-slices3-4.md`,
  plus the re-checks in `feedback.md`.
- Design: `design/chords-r4/` (round 5), the critic's scores in `journal.md`.
