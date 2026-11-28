# User test: Meander, phase 4 (Music), 27 Nov 2026

Simulated (user-tester agent, persona Sam as a house fan), laptop 1440×900 plus a phone pass at 390×844, build 6da411a. Screenshots: `design/phase4/test-*`.

**Verdict (in character):** "I typed nothing and clicked three times, and I knew house came from disco and that techno, trance and UK garage grew out of it. That's the thing I came for."

**Bars:** M-S1 3 of 3 (50–100 s, 3–4 clicks) · M-S2 met (1 click; opens a YouTube search) · M-S3 met (blues → R&B → funk → disco → house, ~2.5 min) · M-S4 met (fields and progress kept apart).

**Jobs:** whole shape 4/5 · connected and switch 5/5 · short summary 4/5.

| ID | Severity | Finding |
| --- | --- | --- |
| F1 | major | The timeline's hover curves don't say how genres are linked, so Ambient (fused with house) reads as a parent. Wrong-belief risk |
| F2 | minor | The neighbour's reason shows only as a 3-word label on laptop; the full sentence is never shown |
| F3 | minor | Labels drift from their dots in the dense electronic cluster and some focus views |
| F4 | minor | A record opens a YouTube search, not a track (honest, one more click) |
| F5 | minor | The inactive field name measures 4.3:1, under AA |
| F6 | minor | Switching back to a field loses the open genre |
| F7 | polish | The phone Genres list is flat; House is row 33 |
| F8 | polish | Uneven timeline axis; some labels at the far right end |
| F9 | polish | Your thread says "begun" and "started" for one state; "Next from here" points back to influences (#44) |

**Value:** would open it again "to dig into Detroit and UK garage records before going out". Same product as philosophy: "clearly the same app… music actually feels more natural because I can listen." Would pay for: real playlists of a thread (Spotify or Apple Music) and sub-genres under house. Biggest idea: a "Your trail" listening path (one record per step walked).

**Tester's process suggestion:** add a wrong-belief check to scenarios (what would the persona wrongly conclude in each view).

## Re-check after fixes (27 Nov)
M-S1 from the timeline first: pass, 4 clicks, ~60 s; the wrong-belief check is clean (Ambient reads "fused with it", no longer a parent). F1, F2, F5, F6, F7 fixed; F3 fixed in the R&B view but labels still sit 50–80 px from their dots in the overview's electronic cluster and the Funk view (left for the owner with the critic's overview-label gap, L58). New: N1 the reason line sits far from the eye and some reasons read like source notes (rewritten, T41); N2 curves cross some faded timeline labels (polish).
