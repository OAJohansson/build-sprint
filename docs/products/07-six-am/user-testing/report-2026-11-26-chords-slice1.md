# User test: Six AM, Phase 6 slice 1 (Make guesses the chords and plays them), 2026-11-26

**Persona:** the owner, Phase 6 update (no theory, plays a little piano by ear, judges by hearing, reads almost nothing) · **Method:** simulated (agent), desktop Chrome (1440 × 744, 1440 × 900, 1280 × 800, 1280 × 720) · **Build:** branch `claude/07-six-am-chords-cdf1b0` at 06a255e, dev server, in-memory sandbox, `test-code` · Saved by the PM (the tester's Write was refused); key screenshots in `shots-2026-11-26-chords-s1/`.

## Verdict
"The part I wanted works: tap a bar, hear the track, tap a chord, it's in Mine. Make said G7 for every bar; when one bar was Am I got it back to G7 in three taps. But I waited 40 seconds before hearing anything, the score stayed at 14 whatever I did, and I couldn't read the two little chords at the end. I'd come back, mostly for the cards."

## Jobs
| Job | Score 1–5 | Why |
| --- | --- | --- |
| 1. Hear which bar sounds off | 3 | A/B and Track work, but the real read of 69–76 marks no bar unsure, bar 76's half-bar names are 5 px, and the closeness score never moves: nothing points to a weak bar. |
| 2. Try a few versions next to the track and keep one, in a couple of taps | 4 | H14 in 3 taps; each card plays and goes into Mine at once; the playing card is lit with a pause icon; "All 7 G7 bars" did what it says. |
| H13 for this slice: fix a planted wrong chord | 4 | Meets the bar (≥ 4). |

## Scenarios
| # | Scenario | Result | Taps / time | Main issue |
| --- | --- | --- | --- | --- |
| C6-S1 | Hear Make's chords, find the unsure bar | struggle | 8 taps from Analyse; first chord sound ~45 s after entering Melody (≈19 s Deck + share, ≈21 s fill, ≈5 s to find B) | No unsure bar on the real read; Make's chords silent until B or a card is tapped |
| C6-S2 (slice 1 part) | Cards, fix a bar, All N bars, More chords | pass | H14 **3 taps** (tile, Track, G7); all bars 2 taps; one bar 3 taps; More 1 tap | Score stuck at 14; at 1280 × 720 More's last row and "Fewer chords" sit under A/B |

**Stuck points (no hints):** (1) after the fill, A (the track) is lit, so they heard the track, not Make, and found B by trying (~5 s); (2) looking for the unsure bar (~10 s, no result); (3) "All 7 G7 bars" appears ticked only after the pick, reading as "I just changed all 7" (2 s); (4) after unticking All and picking on bar 72 the checkbox disappears and stays off for the next bar.

## Findings
| ID | Severity | What happened | Suggestion |
| --- | --- | --- | --- |
| CS1-1 | major | "closeness · chords 14 / 100" never moves through any pick | Make the score follow Mine, or hide it until it does |
| CS1-2 | major | Real read of 69–76 marks no bar unsure (weakest cell Csus2 bar 76, score 0.87, no "?") | Tune the unsure rule on real scores; flag the weakest cells |
| CS1-3 | major | Half-bar names at bar 76 drawn at 5.1 px (tiles 41 × 60 px) | ≥ 11 px minimum, or the name in the open bar's heading |
| CS1-4 | minor | After the fill A plays; Make's chords only after B or a card | Switch to B · Mine when the fill finishes |
| CS1-5 | minor | Build loops 65–76; no tap loops 69–76 | Note in the test plan only |
| CS1-6 | minor | "All N bars" checkbox 16 px, disappears with one bar left, stays off after | Always visible, on by default per bar, ≥ 44 px target |
| CS1-7 | minor | 1280 × 720: More chords' third row and "Fewer chords" under A/B | 4 cards per row at ≥ 1280 px, or "Fewer chords" where "More chords" was |
| CS1-8 | minor | Bass tab's "chords est." strip says G, Melody says G7 | Feed it from the same read, or label it the older estimate |
| CS1-9 | polish | Edited bars look the same as Make's | A small mark on edited tiles |

## Value
- **Earns its place:** the chord cards (one tap hears and keeps, Track beside them, lit card shows what plays); H14 in 3 taps; fixes survive switching families.
- **Doesn't yet:** the score, the "?" and the half-bar tiles, all meant to point at the off bar.
- **Would bring them back:** saving to the Studio (slice 3) and the bar on the keys (slice 2).

## Guardrails measured
| Guardrail | Measured |
| --- | --- |
| H14 ≤ 3 taps | **3 taps, pass** (Mine plays G7 at bar 71) |
| H13 ≥ 4/5 | 4/5, pass |
| H11 nothing stored or uploaded | 0 app requests in 10 s of play and 3 picks; localStorage holds only Ears keys and the access code |
| K3 stabs short, held held | Stabs 238–270 ms, 4 a bar; Csus2 held 975 ms |
| Contrast ≥ 4.5 : 1 | all pass (worst 5.56 : 1 at 10 px); half-bar names fail on size (5.1 px) |
| T157 A/B above the save bar | holds at every size; at ≤ 800 px tall the knob value lines hide behind A/B |
| No sideways scroll | pass at 1280 and 1440 |

## Method notes
In-memory sandbox, `ACCESS_CODE=test-code`, empty AI keys, seeded with `sandbox-seed.mjs --base http://localhost:3027`; the server ran from a temporary app copy because another dev server held `.next` (copy deleted). Loop captured with Chrome's `--auto-select-tab-capture-source-by-title="Six AM Deck"` over CDP; 69–76 set with `__sixamLab.setLoop`. The tester can't hear: what played came from `makeChords()`; "?" seen only via `plantChord(74, "G7", {unsure:true})`; H14 via `plantChord(71, "Am")`. Not judged: sound, 16-bar wrap, reload survival, Piano, timing, Mentor, Lead. Suggestion: a `--loop 69-76` seed option or `?loop=` for graders.
