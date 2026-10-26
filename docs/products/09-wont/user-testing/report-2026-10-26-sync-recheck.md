# User test re-check: Wont v1.1 sync, 26 Oct 2026

Simulated (user-tester agent) on a **production build** (`next build` + `next start`, service
worker active), build 6233ce3, laptop / phone / third contexts, sandbox code only. Screenshots in
`screens-2026-10-26-sync-recheck/`.

## Verdict

"I lost signal, closed the app, opened it again: my board was there, and my clean tap and urge
reached the laptop once I was back. The phone showed yesterday's comeback line in the morning even
though the laptop had shown it. Stopping told me the board stays. I'd keep it."

## Bars

| Bar | Result | Evidence |
| --- | --- | --- |
| V1 laptop history unchanged on connect, no flicker | pass | logs and card text identical; polled every 50 ms, never < 2 cards (03–05) |
| V2 empty phone gets everything, no reload | pass | cards after 1.2 s; every day equal (09) |
| V3 tap/undo carry over | pass (first run; unchanged code path) | report-2026-10-26-sync.md |
| V4 offline reload, real no-signal (server stopped too) | pass (F1 fixed) | 11 |
| V4 offline cold open | pass | 12 |
| V4 offline taps instant; Sync screen opens offline | pass | 10, 13–15 |
| V4 after reconnect: all changes on both + server, nothing duplicated | pass | 17, 18; exactly 2 habit-days changed vs V1 notes, 1 urge |
| V5 wrong code changes nothing | pass | 19 |
| F3 stop confirmation | pass | 21, 22 |
| F4 comeback seen per device | pass | 02, 09 |
| F5 code visible as typed | pass | 08 (redacted) |
| No secrets in responses | pass | 409 responses + page source: 0 hits; `/api/sync` no code → 401 |

## Findings

| ID | Severity | What | Suggestion |
| --- | --- | --- | --- |
| R1 | polish | Sync screen says "Syncing…" for ≥ 1.5 s right after connecting | Check on a real phone at the owner's review |

## Method notes

Hiding and focus simulated with dispatched events (headless). A raw `JSON.stringify` compare of
logs differed only in day-key order; canonical compare equal. Grader suggests a one-call sandbox
reset script for future runs.
