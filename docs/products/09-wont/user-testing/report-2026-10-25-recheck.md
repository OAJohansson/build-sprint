# User test re-check: Wont, 2026-10-25 (simulated, user-tester agent)

Build `59d9944`, Playwright Chromium 390×844, clock moved with `page.clock`; S4 run twice (cold
opens, and the same tab resumed without reloads). Screens in `screens-2026-10-25-recheck/`.

**Verdict (in character):** "Yes, I'd still be using it after a week. Every button says what it
does, the morning after my slip it named the right day, and the numbers dent instead of dropping
to zero. The one thing: I opened it Wednesday, didn't log, disappeared until Saturday, and it
said nothing about me coming back."

Verified fixed: 24, 25, 26, 27, 28, 29, 33, 34; 30 as checked; 32 mostly (disabled Save reason).

| Job | Score |
| --- | --- |
| Log a slip, encouragement and one next step | 4/5 |
| Write a habit as an if-then commitment | 5/5 |
| Log a kept day in one tap | 5/5 |

| Scenario | Result | Taps / time |
| --- | --- | --- |
| S1 Log the wake-up | pass | 1 / ~3 s |
| S2 New build habit, then edit | pass | 7 / ~50 s |
| S3 Urge, slip, come back | pass | slip 2 / ~6 s |
| S4a Week, cold opens | pass | numbers right |
| S4b Week, resumed without reload | pass | identical to S4a |

R1–R8 all pass. Guardrails: enabled text worst 4.92:1 (pass); correct data 12/12 fields and
25/25 day entries (pass); phone pass except intro Skip 39×44 px; guilt words 0 on app screens.

New findings: N1 (major) the comeback message shows once per run of misses, so a return after a
longer absence that was opened mid-run shows nothing · N2 disabled submit 2.82:1, no reason ·
N3 morning-after-slip message has no step · N4 "Saved" appears far from the button · N5 card
title lowercase as typed · N6 "this week" label vs pile; "the last few days" for two days ·
N7 intro Skip 39 px wide.
