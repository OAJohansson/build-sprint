# User test: Six AM, Phase 6 slice 2 (Piano and timing per bar), 2026-11-26

**Persona:** the owner, Phase 6 update · **Method:** simulated (agent), own Chrome over CDP, 1280 × 800 / 720, 1440 · **Build:** 42ada83, sandbox (in-memory, `test-code`) from a temporary app copy · Saved by the PM; shots in `shots-2026-11-26-chords-s2/`.

## Verdict
"Finally I can add my own touch: tap Piano, light one more key, hear it, the name changes to '≈ G'. Moving a hit is two taps; saving and loading after a reload gives back exactly what I made. But I changed one chord and it changed seven bars, and Reset only fixed one. I tried to drag a hit like in any DAW and nothing happened."

## Jobs
| Job | Score | Why |
| --- | --- | --- |
| Edit a note | 3 | Keys clear, a tap plays and keeps, heading shows the closest name; but with All on the edit goes to 7 bars and Reset clears only the open bar (S2-1) |
| Move a chord (timing) | 3 | Select + Later is 2 taps; add, remove, Held, Short hits work; but 18 px hits, 21 × 24 add slots, no drag or arrows, "Longer" greyed with no reason, score ignores timing |
| Save and get it back (H9) | 5 | 5/5 reloads exact |

H13 bar (≥ 4) not yet met for "edit a note" and "move a chord".

## Tap counts
Open Piano 2 · add/remove a note 1 · reset the bar 1 · reset a 7-bar group edit ≈ 19 · Held/Short 1 · move a hit 2 · add a hit 1 · remove a hit 2 · one bar only +1 · load a saved sound 2.

## Stuck points (no hints)
1. Reset after a group edit (~20 s, dead end). 2. Tried dragging a hit (~10 s), then found tap-to-select. 3. "Longer" greyed out, no reason. 4. "≈" before the name, unexplained but understood. 5. "Your sounds" below the fold of the preset menu at 744 px. 6. At 720 px, More or Piano scrolls the chord names out of view.

## Findings
| ID | Severity | What happened | Suggestion |
| --- | --- | --- | --- |
| S2-1 | major | Edits go to the whole group, Reset only to the open bar; "Make's guess" restores notes but not timing | Reset follows "All N bars" |
| S2-2 | major | Closeness ignores timing (51 through Held, Short, Later, add, remove) | Count onset timing, or label it chords-only |
| S2-3 | minor | Small timing targets (hits 18 px, slots 21 × 24, buttons 26–28 px) | Strip ≥ 32 px, slots ≥ 24 × 32 |
| S2-4 | minor | No drag, no arrow keys on hits | Drag on the 16th grid, ← / → on a selected hit |
| S2-5 | minor | "Longer" disabled with no reason | Push the next hit, or say why |
| S2-6 | minor | Your sounds below the preset menu's fold at ≤ 744 px | Your sounds first when there are any |
| S2-7 | polish | At 720 px More/Piano scroll the chord row out of view | Keep the tile row pinned |
| S2-8 | polish | "G, in Mine" while Mine plays G + A | "your notes (≈ G)" |

## Re-check
CS1-1 fixed (G7 58, G 55, one bar G 57) · CS1-7 fixed (with side effect S2-7) · CS1-10 fixed · CS1-11 fixed · CS1-12 not checked (no half-bars in today's 69–76 reads) · CS1-13 fixed.

## Guardrails
H9 5/5 pass · K5 closest name shown (≈ G7, ≈ G) · K6 moved hits play where placed; Held is one 16-step chord · no sideways scroll; A/B above Save at 800 and 720 · 390 px: the Lab has no narrow layout, so the chords panel's phone layout can't be reached (Mentor column covers it).
