# User test: Phase 7 slice 2 (rows, fix by ear, click to jump, old sounds), 27 Nov 2026

Simulated (user-tester agent), sandbox :3037, code 0a63c04, desktop Chrome at 1440 × 900 and 1280 × 720; loops Lost in the Loop 76–83, Mason Flint 57–64 and 41–48.

**Verdict:** the rows-to-fill banner is what the owner asked for (W7 4/5), but fixing by ear is fiddly (steps a few px wide) and edits don't come back after a reload. W14 not met for slice 2.

| Job | Score | Why |
| --- | --- | --- |
| See which rows are mine to fill (R7-S2) | 4 | Shaker and Ride named in ~3 s, 4/5; an empty-read Open hat had no line (U7-12) |
| Add or remove a hit (R7-S3) | 2 | cells 4.6 × 40 px at 1440, 3.3 × 28 at 1280 (U7-10); 32 taps for offbeat shakers (U7-14); edits gone after reload (U7-11) |
| Mute a row | 4 | one tap; on-state subtle |
| Click to jump (R7-S4) | 3 | Melody / FX exact; Drums 2–3 sixteenths late (U7-13); Bass only a thin strip (U7-15) |
| Old sounds, "Melody & FX" (R7-S5) | 5 | W16 pass |

| ID | Severity | Finding |
| --- | --- | --- |
| U7-10 | major | drum steps too thin: 1 in 4 (1440) to 2 in 5 (1280) taps miss with ±3 px |
| U7-11 | major | after reload the edits are gone; loading the saved row restores the sound, not its hits |
| U7-12 | minor | a row Make read nothing on (Open hat) has no line and isn't counted |
| U7-13 | major | Drums ruler: bar label overflows a 5 px button; jump starts 2–3 sixteenths late (+132 ms on the bar button) |
| U7-14 | minor | no repeat: offbeat shakers over 8 bars = 32 taps |
| U7-15 | minor | Bass: only 76 and 80 labelled; the notes area doesn't jump |
| U7-16 | minor | save per row: 2 taps per row |
| U7-17 | polish | old synth drum knobs still show "A1", "460 ms" |
| U7-18 | polish | zero-state wording awkward |

Testing-system note: each tester needs its own scratch folder and CDP port.
