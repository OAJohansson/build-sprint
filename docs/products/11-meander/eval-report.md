# Eval report: Meander, first working version (13 Nov 2026)

Preview: https://meander-igcr33bd9-mimirswell.vercel.app (Vercel login) · Branch `claude/11-meander` · Bars from `evals.md`. Graders never built what they graded: `user-tester`, `design-critic` and `data-evals` ran the checks; the engineer and the writer built.

## Requirements

| # | Result | Evidence |
| --- | --- | --- |
| R1 Whole map fits, no overlaps | pass | User test: 23/23 labels on screen, 0 overlaps. Final layout check (L21): 0 overlaps, 0 labels over dots, 0 swapped pairs in all 23 focuses; 8 labels poke a few px past the rim |
| R2 School content | pass (as reconciled, T20) | 23/23 schools have a tagline, 3 questions, 5 themes with 2–3 sentences and thinkers, 3–5 thinkers; reacted-against shown as the "pushed against" neighbour with its reason |
| R3 Neighbour opens, globe turns | pass | User test S2, 3/3 |
| R4 Thinker + copied prompt | pass | Clipboard: "Teach me Simone de Beauvoir as a short Socratic module…" |
| R5 Visits survive reload | pass | User test: rings and Your thread correct after reload; 7 unit tests (midnight, month end, same day, empty) |
| R6 Back to the overview | pass (as reconciled, T20) | Logo or empty space from every level; Esc steps back one level |
| R7 Accuracy | pass, with a caveat | See Content accuracy |
| R8 Phone | pass | 390×844: list → school → thinker → copied; targets ≥ 44 px after the fix round |

## User test (Sam, simulated, before the fix round)

| Scenario | Bar | Result |
| --- | --- | --- |
| S1 Where does existentialism sit? | ≤ 5 min, all three answers correct | pass: ~1.5 min, all correct |
| S2 The hop | ≤ 3 clicks, 3/3 | pass: 1 click each, 3/3 |
| S3 Thinker → Claude | ≤ 2 clicks | pass: 2 |
| S4 Where have I been? | right days, midnight split | pass (visits) / struggle ("where next?") |
| S5 Lost and back | 1 click | pass |

Jobs: whole shape 3/5, what's connected 4/5, short summary 4/5. **Bar "every top job ≥ 4/5" not met for job 1** (no era cue in the overview). Fixed since: link reasons on hover, taglines, overview hover lights a school's threads, two-way verbs, "Also in", phone targets. Not re-tested after the fixes.

## Design

- Critic on the built app: **9/10** (same as the approved canvas). All six findings fixed. Not re-scored after the last fixes.
- No "Whole field" pill, no dates on the globe, no welcome line, themes in the card: as approved.

## Content accuracy (the trust bar, L14)

| Eval | Bar | Round 1 | Final |
| --- | --- | --- | --- |
| Sourced | 100% | 100% | 100% (805 sourced objects, 56 links) |
| Supported | 0 wrong, all unsupported fixed or cut | 3 wrong, 282 unsupported of 2,825 claims | **0 wrong, 0 unsupported** (0 of 855 items failing) |
| Links | 100% | 56/57 | 56/56 |
| Study prompts match the card | 100% | 52/88 | 88/88 |
| Hand spot-check | 20/20 | 20/20 | 20/20 |
| No sample content | 0 | 74 in the app | 0 |

**Caveat:** the API judge hit the account's usage limit after round 1 and part of round 2 (access back 1 Dec). About 195 items were last graded in-session by the grading agent, same model and rubric, but no second grader checked those verdicts. Closing it: re-run the cached judge after 1 Dec (backlog). Judge cost so far: about $28.

## Guardrails

| Guardrail | Bar | Result |
| --- | --- | --- |
| Readable text | ≥ 4.5:1 | ≥ 5.63:1 in every state |
| Visits correct | 100% | 100% (fresh and seeded runs) |
| Phone | works, targets ≥ 44 px | yes, after the fix round |
| No live AI | 0 model calls | 0 |

## Build hygiene

`pnpm -F 11-meander build`, `lint` and `test` (7 tests) pass. No secrets in the diff; the app needs no env keys.

## Skipped or not verified

- No re-run of the user test or the critic after the last fix round (content and layout changes only).
- The hover link-reason tag can sit over a dim label behind it (seen on Existentialism, hovering Phenomenology).
- Focus isn't in the URL, so a school can't be linked or restored on reload (`// shortcut:` in `meander.tsx`).
- Arrow keys on the globe aren't handled.
- The source corpus itself (SEP/IEP) is trusted, not checked.

## Decision log

L1–L21 and T1–T25 in `decisions.md`.
