# User test: Six AM Phase 5 final re-test (drums, FX, Mentor), 2026-11-13

Persona: the owner (beginner bedroom producer, no theory) · Method: simulated (agent), 1440 × 900 · Sandbox :3017 (in-memory, `test-code`, seeded with the seed script; Mentor key in the server process only) · `?quiet=1` · Melody is off this phase (L247).

## Part 1: M-S9 and M-S10 after FX-F1–F9, FX-R1–R4

### M-S9 Add FX to a drop: 4/5 (was 3)
- Mason Drop 2: 4 taps, ready 37.8 s after Play (t01).
- F2 fixed: each row says what it is ("Impact · a hit that marks the drop's first beat", "Downlifter · falls after the hit to let the energy down", "Noise riser · builds tension into the next part").
- F3 fixed for the beginner: with no ticks the Mentor suggests a start, "A house drop often uses a Sub drop with a 1-bar tail. Try it", with a "Try it" link (t02).
- F4 fixed: the tags match the knobs ("2.6 bars", "5 bars"). F5 fixed: the impact is drawn 2.6 bars long (t02-fx-impact).
- R2 fixed: a 5-bar riser saves ("Saved as Bright noise riser, long, from Tim Deluxe") (t05).
- F6/R4 fixed: dropped on Top / FX at bar 41, the toast says "Shortened Shaker Loop on Top / FX." with Undo; the block survives a reload (t06).
- Left: F9 is only partly fixed. The label reads "bars 51–56" for a 5-bar riser that starts at bar 52 (off by one), and it sits left of the shape (t04). Still no ticks or score on this drop (by design).

### M-S10 Mentor on the open row (Drums, FX): 1/5, blocker
- FX, Noise riser row: the request now sends `part: other` and the correct `makeRow` (F1 fixed in the request). But the answer is "The Mentor's answer didn't come out right. Try again." (502). The server log says: `[mentor] invalid: The answer failed validation twice: In Make, don't open with "I can't hear the sound itself"…` (t07, t08-mentor-fx-502).
- Drums, Hats row: the same 502 (t09, t10-mentor-drums-502).
- The new F7 rule rejects the model's answers, and each question burns two model calls. So the Mentor in Make is unusable right now.
- Mentor questions used: 2 of 3 (each made 2 model calls).

## Part 2: quick regression pass (M-S1, M-S3, M-S5)
- **M-S1 Drums from a loop: pass (4/5).** Lost Drop 1: 4 taps, ready 41.3 s after Play (the countdown reads "29 s" at 12 s). The rows fill, and picking Kick or Hats moves nothing (rows at y 243/371). Kick "closeness · kick 83", "You're on the gold ticks". New on Hats: "Shaker gets closer (about 83 against 61 at best here). Try Shaker" (final-drums-hats).
- **M-S3 Save and use: pass (5/5).** Save kick and Save hats → "✓ saved". Studio: the kick dropped on Drums lands there. The hats dropped on Drums create a "Hats" lane with "Hats go on their own lane: added "Hats"." Both survive a reload (t11, t12).
- **M-S5 Bass unchanged: pass (5/5).** Same screen, ticks and Mentor hint ("Length down to 1/16, Tone up to warm"); bass ready 35.2 s from a cold Play (final-bass).
- Breakdown row off (Mason 57–64): "Kick off" with "Probably the bass bleeding through" on the row, the Mentor explaining the off state, "Play anyway", and closeness shown as "–" while it's off (N3 fixed) (final-drums-row-off).

## Part 3: screenshots for the design critic (1440 × 900)
All in `shots-2026-11-13-final/`:
- `final-drums-kick.png`: Drums, kick open, on the ticks, 83.
- `final-drums-hats.png`: Drums, hats open, with the "Try Shaker" suggestion.
- `final-drums-row-off.png`: Mason breakdown, the kick row off with its reason.
- `final-drums-waiting.png`: Drums, filling the loop (countdown).
- `final-fx.png`: FX, Noise riser open, with "Try it".
- `final-bass.png`: Bass.
- `final-melody-comes-next.png`: the Melody tab, "Melody comes next…" with "Make a bass instead".

## Scores
| Job | Score | Note |
| --- | --- | --- |
| M-S9 FX on a drop | 4 | F2–F8 visible fixes hold; R2, R4 fixed; F9 label off by one |
| M-S10 Mentor on the open row (Drums, FX) | **1** | Blocker: every Make answer fails the new opener rule twice → 502 |
| M-S1 Drums from a loop | 4 | Wait still 41 s on 16 bars |
| M-S3 Save and use | 5 | |
| M-S5 Bass unchanged | 5 | |

## Findings
| ID | Severity | What | Evidence |
| --- | --- | --- | --- |
| FN1 | **blocker** | The Mentor in Make returns "The Mentor's answer didn't come out right. Try again." (502) in FX and in Drums. Server: `[mentor] invalid: The answer failed validation twice: In Make, don't open with "I can't hear the sound itself"…`. The F7 rule rejects the model's own opener; each question costs 2 model calls and gives nothing | t08-mentor-fx-502, t10-mentor-drums-502 |
| FN2 | minor | The riser label reads "bars 51–56" for a 5-bar rise drawn from bar 52 (off by one); the label sits left of the shape | t04 |
| FN3 | polish | Bass still shows the disabled "Suggested" pill, where Drums and FX show "Ticks placed" | final-bass |
| FN4 | polish | Drums hats: "Ticks placed" floats to the right of the second line of the Mentor text, not aligned with it | final-drums-hats |
| FN5 | polish | The Melody tab is off, but the Mentor panel still invites "Ask about the melody" | final-melody-comes-next |

## Method notes
- Sandbox :3017, in-memory, `test-code`, seeded with `apps/07-six-am/evals/sandbox-seed.mjs` (now also seeds the analyses). `ANTHROPIC_API_KEY` came from the root `.env.secrets.local` into the server process only; never printed or written. The seed script warns "NOT set" because it checks its own shell, not the server's.
- Mentor questions: 2 of 3 used (both 502, each 2 model calls by the server's message); the third was kept for a re-check after a fix and not used.
- Stopped at the end: the dev server (it held the key) and the test Chrome.
