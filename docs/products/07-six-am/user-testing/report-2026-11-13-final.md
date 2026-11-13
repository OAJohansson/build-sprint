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
- FX, Noise riser row: the request now sends `part: other` and the correct `makeRow` (F1 fixed in the request). But the answer is "The Mentor's answer didn't come out right. Try again." (502). The server log says: `[mentor] invalid: The answer failed validation twice: In Make, don't open with "I can't hear the sound itself"…` (t08).
- Drums, Hats row: the same 502 (t10).
- The new F7 rule rejects the model's answers, and each question burns two model calls. So the Mentor in Make is unusable right now.
- Mentor questions used: 2 of 3 (each made 2 model calls).
