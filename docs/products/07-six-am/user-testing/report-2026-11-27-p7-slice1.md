# User test: Phase 7 slice 1 ("more starting sounds"), 27 Nov 2026

Simulated (user-tester agent), sandbox on :3037, build bb7bea0, desktop Chrome at 1440 × 900 and 1280 × 720.

**Verdict:** the family + feel-word shelf works: every target found from labels in one tap ("808 long boom", "Dusty lo-fi", "Organ bass (90s house)"). But the shelf hides its last columns with no cue, so the new real basses (the slice's headline) were found only by a sideways swipe; at 1280 × 720 about half the sounds are out of sight.

| Job | Score | Why |
| --- | --- | --- |
| Find a sound of a feel | 4 (3 at 1280 × 720) | 6/6 targets in one tap; 1–5 sounds hidden per row at 1440, ~half at 1280 (U7-1) |
| Shape it with the knobs | 4 | every knob moves end to end with direction words; drum values in Hz / dB / st, Mentor tips read contradictory (U7-3, U7-4) |

Latency: tap while stopped 15 ms; while playing 140–191 ms (W12 ≤ 300 ms). Contrast worst 5.56:1. Credits one tap from every shelf.

| ID | Severity | Finding | Suggestion |
| --- | --- | --- | --- |
| U7-1 | major | Shelf scrolls sideways with no cue: visible at 1440 Kick 19, Claps 18, Hats 18, Bass 15 of 20 (all 3 sampled basses hidden); 1280 × 720 ~13 kicks, ~9 basses | wrap families onto more lines or fit them; at least a fade + "+N →" |
| U7-2 | minor | the sound's one-line description is cut with "…" for 43 of 60 drum sounds | wrap to two lines or shorten copy |
| U7-3 | minor | drum knob values in Hz, dB, ms, st; bass knobs use words | words only, numbers in the tooltip |
| U7-4 | minor | Mentor tips "Length down to longer", "Tone up to as is" | phrase as a target ("make it longer") |
| U7-5 | minor | sticky A/B row covers the Mentor's "Try 808 rusty" line and half of Suggest at 1440 | keep the tip above the sticky row |
| U7-6 | polish | "Shaker-like" family in Closed hat; sounds named like their family ("Lo-fi snare" in "Lo-fi snare") | rename the sounds |
| U7-7 | polish | bass lines say "(recorded, from tonejs-instruments)" | credit in Sound credits; "real bass" in the line |

Progress idea: show each tapped sound's closeness on its chip, so "which of the 20 was closest?" needs no memory.
Testing-system notes: a screenshot subfolder per grader; a `?loop=` URL parameter.
