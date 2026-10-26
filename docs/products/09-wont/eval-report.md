# Eval report: Wont (Founder mode, 24–25 Oct)

The PM's report of what the graders found (decision 0026). The builders' own opinions are not in
it. Graders: `user-tester` (3 runs: full test, full re-check, targeted re-check), `design-critic`
(a fresh critic each round, screenshots only), a break-ui and guidelines audit. The owner-only
checks are the owner's and not here.

**Preview:** https://wont-5f8nua409-mimirswell.vercel.app (behind Vercel login; the latest build)
· **Branch:** `09-habits` · **PR:** OAJohansson/build-sprint#80

Note: https://wont-peach.vercel.app is public and shows the **first** build (before both fix
passes, with the invisible save button). It went to Production by mistake on the project's first
CLI deploy (journal, T21); it is replaced when the owner approves the merge and `pnpm ship` runs.

## Summary

| Area | Bar | Result |
| --- | --- | --- |
| Riskiest assumption: a written commitment plus a gentle comeback keeps me going after a miss (S3) | slip ≤ 20 s / ≤ 3 taps; next open shows one next step, no guilt words; next clean day marked as a comeback | **pass** (2 taps / ~6 s; "Friday had a slip. Your 6 clean days still count. Next time: chew gum first."; green winking "Comeback") |
| Requirements R1–R8 | all pass | **pass** (8/8, two user-test runs) |
| User test | every top job ≥ 4/5, no blocker or major open | **pass** after fix passes 2 and 3 (jobs 4, 5, 5); N1 and the double-tap duplicate (N8) fixed and re-checked |
| Design | design-critic ≥ 9/10 | **fail: 6/10** in every round (5 rounds), see below |
| Guardrails | contrast ≥ 4.5:1, data word for word 100%, phone 390×844 with ≥ 44 px targets | **pass** (worst enabled text 4.92:1; 12/12 fields and 25/25 day entries; 0 overflow, all targets ≥ 44 px) |
| Things to avoid | none visible | **pass** (0 guilt words on app screens, no red, no streak reset, no badges) |
| Build hygiene | lint, test, build | **pass** (34 unit tests); `checks` on the PR |

## Requirements

Run by the user-tester (UT) unless noted.

| # | Result | Evidence |
| --- | --- | --- |
| R1 Intro on first launch, skippable, replayable | pass | Fresh storage plays the intro; Skip lands on the empty board; "Watch the intro again" replays it |
| R2 Build habit as an if-then commitment with a daily goal | pass | "After I brush my teeth, I will read in bed · 10 pages", saved word for word |
| R3 Stop habit with trigger, friction step, replacement | pass | Card: "Usually after coffee. Instead: chew gum"; friction step on the habit page |
| R4 One-tap log, saved | pass | 1 tap / ~3 s; still kept after reload |
| R5 Clean, slip (with size) and urge logged separately | pass | Three distinct entries in storage and history ("Slip of 1 · 1 urge") |
| R6 A miss never resets to zero | pass | 7 → 6 → 5 → 4 of last 7; clean days stay at 6 and 8 through slips; "Back today" instead of "0 of last 7" |
| R7 Gentle comeback message after a missed day | pass | Names the right day, one next step; the stale-slip bug (F2) and the once-per-run gap (N1) are fixed |
| R8 First kept day after a miss marked as a comeback | pass | Green winking wonton plus "Comeback" on the card and in history |

## User test

| Scenario | Bar | Result |
| --- | --- | --- |
| S1 Log this morning's wake-up | ≤ 5 s, ≤ 1 tap | pass: 1 tap / ~3 s |
| S2 New build habit as a commitment | ≤ 60 s, ≤ 8 taps | pass: 7 taps / ~50 s (failed in run 1: blank save button; fixed) |
| S3 Slip, then come back | ≤ 20 s, ≤ 3 taps | pass: 2 taps / ~6 s |
| S4 A week with two misses (time passes) | numbers right, history intact | pass both with reloads and with the same tab resumed (00:30 rule, 03:59/04:00, month end, the 25 Oct clock change) |

In character, after the re-check: "Yes, I'd still be using it after a week. Every button now says
what it does. The morning after my slip it named the right day and told me my clean days still
count, and the numbers dent instead of dropping to zero."

## Design: 6/10, bar not met

The critic scored the board 6/10 in five rounds (prototype rounds 1–4 and the built app twice).
The score stayed flat because its top asks remove requirements the critic never saw: the rolling
number (R6, P6), the anchor line (the if-then plan, P1, the strongest evidence), the week strip
(the owner's request) and the comeback line (R7). The PM overruled those (L19) and took every
in-pack point: kept cards wash warm, bigger steamer, no dark band (owner, L25), quieter dots, no
grey slip state, real buttons. What the critic consistently keeps: "the steamer basket of wontons
filling up … progress as colour filling up done right" and the honest copy. Process lesson in the
journal: give the critic the non-negotiables next time.

## Guardrails

| Guardrail | Measured | Bar | Result |
| --- | --- | --- | --- |
| Readable text | worst enabled text 4.92:1 (muted line on the kept wash); was 1.0:1 and 3.92:1 in run 1 | ≥ 4.5:1 | pass |
| Correct data | 12/12 typed fields word for word; 25/25 S4 day entries on the right day | 100% | pass |
| Phone | 0 overflowing screens at 390×844; all targets ≥ 44 px | yes | pass |
| No guilt | 0 hits for broke, fail, streak, reset, lost, relapse on app screens; no red | 0 | pass |

## Decisions

Learning decisions L1–L26 and toil T1–T21 are in `decisions.md`. The owner made the product and
design calls (L1–L8, L17–L18, L24–L25); the PM's calls inside the pack are marked PM.

## Skipped or not checked

- Not tested on a real phone (sheets, safe area, the standalone status bar), or with a screen
  reader, or with RTL input in the browser.
- The intro's animation craft was not graded (critic sees screenshots only).
- Parked past the stop line (backlog): a comebacks line per habit ("3 slips, 3 comebacks"), a
  "not today" close, history beyond 14 days, showing "why" back.
- All copy is draft, in `apps/09-wont/src/lib/copy.ts`, for the owner's rewrite.
