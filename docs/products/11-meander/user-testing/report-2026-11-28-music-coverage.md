# User test: Meander, music coverage re-check (L59), 28 Nov 2026

Simulated (user-tester agent), persona Sam as a house fan. Laptop 1440×900, then phone 390×844, on commit `05f2f5a`. Scenarios M-S5 to M-S8 in `plan.md`.

## Verdict (tester's words)
"I found pop and indie straight away, and the reggaeton and Afrobeat/Afrobeats views taught me something without making me read a wall of text. I'd come back. The main thing that still trips me is the lines."

## Scenarios
| # | Scenario | Result | Clicks / time |
| --- | --- | --- | --- |
| M-S5 laptop | Where is pop? Where is indie? | pass | 4 clicks; pop ~6 s, indie ~4 s |
| M-S6 | Reggaeton's roots | pass, no hip-hop-only belief | 3 clicks, ~40 s |
| M-S7 | Techno's ancestors, hear one | pass, some friction (12 neighbours) | 3 clicks, ~50 s; named krautrock, industrial, synth-pop, Hi-NRG |
| M-S8 | Afrobeat vs Afrobeats | pass | 4 clicks, ~45 s; correct one-sentence difference |
| M-S5 phone | Pop and indie | pass | 4 taps + 1 scroll, ~35 s |

Jobs: whole shape 4/5 · connected 4/5 · short summary and listen 5/5.

## Findings
| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| F1 | major | Neighbours that sit on one line from the centre read as a chain (Afrobeat → Soul → Funk); a wrong belief formed briefly | for the owner: this is L58's open "even-angle neighbour rings" call, now with evidence |
| F2 | minor | Two phone link labels read backwards from one end ("rock and roll's offspring") | fixed, T43 |
| F3 | minor | Side fusions (grime with indie, K-pop with techno) weigh as much as main roots | backlog |
| F4 | minor | The link reason shows only at the bottom edge on hover | backlog (overlaps L58) |
| F5 | minor | No find-a-genre, so absence can't be checked | backlog |
| F6 | polish | Dimmed labels 2.35:1 while a genre is selected | backlog (deliberate de-emphasis, L58) |

## Coverage gut check (tester's answer)
Classical; drill; cumbia and Latin pop; J-pop or Bollywood; tech house. Classical is out of scope (popular music, L45); the rest are in the backlog list under L59 or the sub-genre item.

## Measured
Contrast: smallest label 5.66:1; dimmed labels 2.35:1 (deliberate). Phone targets ≥ 44 px. Spot check of 16 claims on the new genres: 0 wrong; "Blinding Lights" is dated 2020 (the chart-peak year in the corpus; the single came out in Nov 2019).

Screenshots: `shots-2026-11-28/`.
