# User test: Phase 7 slice 4 (Mine / Original) and slice 3 polish, 27 Nov 2026

Simulated (user-tester agent), sandbox :3037 seeded, code 6b0950f, 1440 × 900 and 1280 × 720, with the real Deck window (SoundCloud embed; nothing captured).

**Verdict:** one switch, right where the time is; with the Deck closed it says why and "Open the Deck" fixes it; every flip landed on the bar and back to Mine picked up where the original was. W14 met.

| Job | Score | Why |
| --- | --- | --- |
| Compare at a bar, Mine ↔ Original | 5 | 1 tap, 5/5 flips; Deck landing 0–13 ms (first play 160–246 ms) |
| Fix Original when the Deck is closed | 5 | struck-through Original + strip message + link; ready in 2.2 s |
| Compare a whole section | 5 | header click then Original, 2 taps |
| Find the way into a rebuild | 4 | outlined top-bar button + ruler link |

Slice 3 re-checks: U7-21 fixed; U7-22 fixed (subtle at 1440); U7-23 partly (ranges missing on Build / Outro); U7-24 fixed; U7-25 partly (grid blocks still cut); empty-lane Make link works.

| ID | Severity | Finding |
| --- | --- | --- |
| U7-26 | minor | while Original plays, the Studio Play button shows ▶ |
| U7-27 | minor | "Build one in Make → Melody" doesn't carry the section's bars as the loop |
| U7-28 | polish | the ruler link hides Outro's bar number |
| U7-29 | polish | no way to start from an arbitrary bar in the rebuild (only section starts) |
