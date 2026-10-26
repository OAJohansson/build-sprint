# Eval report: Magpie MVP, 26 Oct

For the owner's final review (Founder mode, decisions 0026 and 0028). Every check below was run
by a grader (`user-tester`, `data-evals`, `design-critic`), never by the builder. All grader runs
used the **sandbox library** (its own access code); nothing touched the owner's book, which is
still empty.

**Preview:** see the PR. **PR:** https://github.com/OAJohansson/build-sprint/pull/89

## Requirements (user-tester, 26 Oct)

| # | Requirement | Result | Evidence |
| --- | --- | --- | --- |
| R1 | Maggie intro once, access code once per device | pass | welcome then code on a fresh install; reload and new tab skip both |
| R2 | Capture by camera, library or no photo | pass | all three reach the details and save |
| R3 | All details saved | pass | 9/9 fields word for word (accents, dashes, quotes); date set |
| R4 | Save never waits for the AI; photo kept | pass | saved in 1.6–2.3 s; drawing screen closed at once; sticker arrived ~10 s later without reload; photo toggle shows the original |
| R5 | Share into Magpie | pass, **simulated** | multipart POST through the service worker opened the details with the photo; a real Android share sheet is the owner's check |
| R6 | Saved moment after every save | pass | after camera, share, no-photo and library saves |
| R7 | Smart shelves match data; empty rows hidden | pass | rows correct on seeded data; no empty rows |
| R8 | Search name, restaurant, note | pass | "noble" → Barolo (restaurant); note words find their yums |
| R9 | Filters narrow, chips widen | pass | 12 cases matched; removing chips widened 1 → 2 → 4 → 8 |
| R10 | Edit, and remove with a way back | pass | edit persisted; Remove → Undo |
| R11 | One library on phone and laptop | pass | saved on the phone, present on the laptop with the filter panel |
| R12 | Empty shelf | pass | Maggie, the share tip and "Snap your first yum" |

Report: `user-testing/report-2026-10-26.md`; re-check after fixes: `report-2026-10-26-recheck.md`.

## User test (user-tester, persona Andreas)

| Scenario | Bar | Result |
| --- | --- | --- |
| S1 Capture a drink at the table | ≤ 30 s, ≤ 10 taps | pass: 8 taps, ~21 s to saved |
| S2 Find "that wine" | ≤ 10 s, ≤ 3 taps | pass: 3 taps, ~6 s |
| S3 Wines 4+ in London | ≤ 15 s, ≤ 5 taps | struggle (6 taps), fixed (F1) → **pass on re-check: 5 taps, ~9 s** |
| S4 Add from a shared photo | ≤ 40 s, ≤ 10 taps | pass (simulated share): 6 taps, ~14 s |

Jobs: Recall 5/5, Capture 4/5, **Relive 3/5** (no view per trip or city: the "Trips row" idea is
first in `backlog.md`, your call). No blocker or major finding left open; 10 of 10 minor and polish
findings fixed or parked with a reason (`feedback.md`).

## Stickers (data-evals grader, 15 cases: 12 Commons photos + 3 edge cases)

| Eval | Bar | v1 | v2 | v3 (shipped) |
| --- | --- | --- | --- | --- |
| Recognisable | ≥ 10/12 | 12/12 (edges 2/3) | 12/12 (3/3) | **12/12 (3/3)** |
| Style consistent | ≥ 10/12 | 10/12 | 12/12 | **12/12** (10/12 strict); outer edge 15/15 |
| Time, save to sticker | median ≤ 20 s | 15.2 s | 15.1 s | **14.2 s** (dev server) |
| Cost | ≤ $0.05 | ≤ $0.042 | ≤ $0.037 | same single call; ≤ $0.046 bound (shared key) |
| Original photo kept | 12/12 | 12/12 | 12/12 | **12/12** |

v1 → v2 named the item in the prompt (a busy photo had drawn the wrong thing) and asked for flat
fills; v2 → v3 moved the die-cut edge into code because the model left the outer outline off a
third of stickers (L8, L9, decision 0029). Contact sheets: `design/sticker-eval/`.

## Design (design-critic, one instance, three rounds, against the canvas screens)

| Screen | Round 1 | Round 2 | Round 3 |
| --- | --- | --- | --- |
| H shelf | 7 | 8 | **9** |
| E details | 7 | 8.5 | **9** |
| G saved | 6 | 8 | **9.5** |
| K item | 8 | 8 | **9** |
| L laptop | 7 | 8 | **8.5** |

Rounds stopped at round 3 (four of five at or over the 9 target). L's remaining gap: the laptop
panel shows the drink sub-kinds before Drinks is picked; that change brought S3 inside its tap
bar, so the user test won. Screens: `design/critic/`.

## Guardrails

| Guardrail | Bar | Result |
| --- | --- | --- |
| Readable text | ≥ 4.5:1 | worst active text 5.19:1 (cocoa on coral; white on coral was 2.9:1, so labels on coral are cocoa, T2); disabled labels 8.93:1 |
| Correct data | 100% | 100% (9/9 fields, 3/3 edits, 12/12 filter cases) |
| Phone 390 × 844, targets ≥ 44 px | yes | yes (two small targets fixed) |
| Grader data | sandbox only | every grader run used the sandbox code; the owner's library is empty |
| Things to avoid (kickoff) | none | none seen |
| Photo never lost | always | 12/12 kept; a failed drawing keeps the photo and offers "Draw it again" |

## Build hygiene

`pnpm -F 10-magpie build`, `lint` and `test` (16 unit tests: new this month, latest order, home
city, shelves, search and filters) pass. No secrets in the diff; every key is in `.env.example`.

## Decision log and what I skipped

Decisions L1–L9 and toil T1–T8 are in `decisions.md` (veto any T by number).

Skipped or not verified:
- **The preview on Vercel is not script-checked.** It sits behind Vercel's login (deployment
  protection), and making a bypass token changes a security setting, so I didn't. Your browser
  is logged in, so the review itself is the first production-build check of `after()` (the
  sticker drawn after save) on Vercel. Everything else ran on the local dev server.
- A real Android share sheet, real GPS, real phone photos and a real phone: yours to try.
- Sticker repeat-draw variance; a double ring on stickers where the model still draws its own
  outline (parked, the kickoff's "don't chase perfect consistency").
- Cleanup for you: `vercel curl` created an empty stray Vercel project named **10-magpie** (not
  the app's project, **magpie**). Deleting it was refused by the permission check; it can be
  deleted in the Vercel dashboard (Settings → Delete), or tell me to.
