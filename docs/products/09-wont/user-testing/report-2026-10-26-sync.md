# User test: Wont v1.1 sync, 26 Oct 2026

Simulated (user-tester agent), Playwright with three contexts (laptop 1280×800, phone 390×844, a
third phone), Europe/Stockholm, sandbox code only, build 1d5537a. Screenshots in
`screens-2026-10-26-sync/`.

## Verdict

"I typed the code once on each device and my history was there, every number the same, and a tap
on one showed up on the other. The one scare is offline: opening the app or tapping 'Offline,
saved here' with no signal gives the browser's error page."

## Scenarios

| # | Scenario | Result | Notes |
| --- | --- | --- | --- |
| V1 | Laptop with history connects first | pass | All 5 histories and numbers unchanged; never flickered empty; server copy equal |
| V2 | Empty phone gets everything | pass | Same board and histories after ~0.7 s, no reload |
| V3 | Phone tap seen on laptop, undo carries back | pass | Tap shows in <100 ms; laptop on focus; undo didn't come back |
| V4 | Offline taps, then reconnect | struggle | Taps instant, all 3 changes on both devices and server after reconnect, nothing duplicated; but the page can't load offline (F1) |
| V5 | Wrong code, stop syncing | pass | Plain wrong-code message; stop keeps the board, no confirmation (F3) |

## Findings

| ID | Severity | What | Suggestion |
| --- | --- | --- | --- |
| F1 | major | Offline reload, cold open, or tapping the offline footer link → browser error page (data safe, page shell not) | App-shell service worker; offline footer not a link |
| F2 | minor | Offline status only in the footer, below the fold with 5 habits | Accept as quiet by design |
| F3 | minor | "Stop syncing" gives no confirmation | One line: sync is off, board stays |
| F4 | polish | A comeback line seen on one device never shows on the other (seen state syncs) | Decide per device on purpose |
| F5 | polish | Code typed blind in a password field on the phone | Show the characters |

## Trust checks

- After V4: laptop = phone = server for every habit-day; exactly the 2 expected habit-days changed
  vs the V1 notes. Nothing lost, nothing duplicated.
- 355 network responses scanned for `sb_secret`, `SUPABASE`, the key and the owner code: 0 hits.
- `/api/sync` with no or wrong code: 401.
- Contrast ≥ 4.92:1 everywhere on the sync UI; targets ≥ 44 px; 0 guilt words.

## Method notes

Focus simulated with a dispatched `focus` event (headless `bringToFront` fires none). The sandbox
was reset twice by the grader before the recorded run (sandbox row only). One unreproduced
observation from a polluted run (a server-only "kept today" not appearing on a freshly seeded
laptop): covered by a new unit test.
