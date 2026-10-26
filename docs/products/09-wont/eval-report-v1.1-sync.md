# Eval report: Wont v1.1, sync (26 Oct)

Founder phase from `kickoff-v1.1-sync.md`. Graders got the artefact and the checks, never the
builder's reasoning. Owner-only check (connect the real laptop, then the phone) is for the final
review.

## Agent-checkable checks

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| S1 | Device with history → empty server keeps and uploads all of it | pass | `sync.test.ts` "first connect" (4 tests); user test V1 (first run and re-check): histories and numbers unchanged, server copy equal, never flickered empty |
| S2 | Empty second device shows the same habits and history | pass | V2 both runs: same board and 14-day histories in ~1 s, no reload |
| S3 | A tap never waits for the network | pass | tap → "Kept" in < 100 ms online, 30 ms offline; no spinner |
| S4 | Offline taps sync once back | pass | V4 re-check on a production build with the server also stopped: reload and cold open offline show the board; clean + urge reached laptop and server, nothing duplicated |
| S5 | Later change wins per habit/day; undo and delete carry over | pass | 9 unit tests (later wins, undo, delete + older edit, offline on both devices, midnight 00:30, yesterday re-log, seeded device + server tap); V3 undo didn't come back |
| S6 | Secret only on the server; wrong code refused | pass | 409 responses + page source: 0 hits for key, codes, `sb_secret`, `SUPABASE`; `/api/sync` no/wrong code → 401 |
| S7 | Graders on the sandbox only | pass | rows keyed `owner` / `sandbox`; graders used `SANDBOX_ACCESS_CODE`; no owner row was ever written; sandbox reset after each run |
| S8 | Shipped logic, copy, design unchanged; tests pass | pass | 34 old + 14 new = 48 tests, build, lint green; the board is unchanged apart from the footer link (T23) |

## Critic

Sync screen: 6.5 → 7.5 / 10 (same critic, two rounds); round 2's copy points fixed (T26). Kept
against the critic: the field frame and radii (the approved habit-form style).

## User tester

First run: V1, V2, V3, V5 pass; V4 struggle (offline open). Re-check on a production build: all
bars pass. Open: R1, "Bringing it up to date…" lasted ≥ 1.5 s after connecting (check on the
real phone). Reports: `user-testing/report-2026-10-26-sync.md`, `…-sync-recheck.md`.

## Guardrails

Contrast ≥ 4.92:1 on the sync UI; targets ≥ 44 px; 0 guilt words; no Supabase table other than
`wont_docs` touched (additive migration only).

## Decisions

L27–L31, T22–T26 in `decisions.md`.

## Skipped

- No real-phone test (owner's review). No conflict UI or sync history (stop line).
- The phone's clock is trusted: a device clock minutes behind can lose a same-habit-day tie.
- The whole document travels each sync (`shortcut:` in `api/sync/route.ts`, fine to ~500 KB).
- Vercel previews are behind Vercel's login, so graders tested a local production build.
