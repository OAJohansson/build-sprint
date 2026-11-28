# Evals: Meander

How the first working version is judged (decision 0026). Written before the build. Whoever builds
something never grades it: the checks below are run by `user-tester`, `design-critic` and
`data-evals`, not by the agent that built the thing. In Streamlined there are no owner-only checks;
the owner's taste is judged at the gates.

---

## Agent-checkable checks

### Requirements

| # | Requirement | Check (fresh install, laptop 1440×900 unless noted) | Run by | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| R1 | The whole map fits a laptop screen on first load | Every school visible without scrolling, no label overlapping another | user-tester | | screenshot |
| R2 | A school shows a one-line description, questions, themes, 3–5 thinkers, what it reacted against (as a "pushed against" neighbour with its reason) and every linked neighbour as go-next (T20); each theme opens in place with 2–3 sentences and its thinkers | Every school in the data has all of these (script); 3 schools spot-checked on screen | data-evals + user-tester | | script output, screenshots |
| R3 | Choosing a neighbour opens that school | One click from Existentialism reaches a neighbour; the globe turns to face it | user-tester | | screenshot |
| R4 | A thinker shows a summary and key ideas; "Study with Claude" copies a prompt naming the thinker and says so | Paste the clipboard: the prompt names the thinker; button reads "Copied" | user-tester | | clipboard text |
| R5 | Opened schools and thinkers are marked as visited, with the date, and survive a reload | Open two, reload: both rings still there; "Your thread" lists them with the right dates | user-tester | | screenshot |
| R6 | From any level, the logo or empty space return to the overview in one click; Esc steps back one level (T20) | Tested from a school, a thinker and an open theme | user-tester | | log |
| R7 | The content passes the accuracy guardrail | See "Content accuracy" below | data-evals | | eval report |
| R8 | On a phone, one school at a time, nothing cut off or overlapping | 390×844: open a school and a thinker | user-tester | | screenshot |

### User test (from `user-testing/plan.md`)

| Scenario | Bar: time | Bar: clicks | Bar: outcome | Result |
| --- | --- | --- | --- | --- |
| S1 Where does existentialism sit? | ≤ 5 min | — | says what came before, what it pushed against, one school it led to; all correct | |
| S2 Something connected but different (the hop) | — | ≤ 3 | opens a connected school and can say why it's connected; 3 of 3 runs | |
| S3 Go deeper on one thinker | — | ≤ 2 | copied prompt names the thinker | |
| S4 Time passes: where have I been? | — | — | visits on the right days, midnight split correct, nothing reset | |
| S5 Lost and back | — | 1 | back to the overview from a school and from a thinker | |

Every top job scored ≥ 4/5 by `user-tester`, and no blocker or major finding left open.

### Design

- `design-critic` scorecard on the built main screen, from screenshots only, **≥ 9/10** (a target, not a blocker).
- The built screens match the approved canvas (round 4 with L15): no "Whole field" pill, no dates on the globe, no welcome line, themes in the card.

### Content accuracy (data-evals; the owner's trust bar, L14)

| Eval | Dataset | Metric | Bar | Result |
| --- | --- | --- | --- | --- |
| Sourced | every school, thinker, date, link and theme in the shipped content | share with a source (URL + section) | 100% | |
| Supported | every factual claim, read next to its cited source by a grader that didn't write it | supported / unsupported / wrong | 0 wrong; every unsupported fixed or cut | |
| Links | every "built on" / "pushed against" link | supported by the cited section | 100% | |
| Hand spot-check | 20 random claims, checked by hand against the source | correct | 20 of 20 | |
| No sample content | content files | items still marked `"sample": true` | 0 | |

### Guardrails (must not get worse; measured with a number)

| Guardrail | How measured | Bar | Result |
| --- | --- | --- | --- |
| Readable text | contrast ratio, dimmest label on the globe | ≥ 4.5:1 | |
| Visits correct | stored visits vs schools and thinkers actually opened | 100% | |
| Phone | works at 390 × 844, targets ≥ 44 px | yes | |
| No live AI | network calls to a model API | 0 | |

### Build hygiene

- `pnpm -F 11-meander build`, `lint` and `test` pass (the visit-day counting test, decision 0011).
- No secrets in the diff.

---

## Phase 4: Music (27 Nov, Founder mode, L44)

Run by `data-evals`, `user-tester` and `design-critic`; never by the builder. Laptop 1440×900
unless noted.

| # | Check | Run by | Bar | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| M1 | Every genre visible on the music globe's first load; rim, overlap, dot and title checks across every view | script (engineer's checker, run by PM) + user-tester | 0 problems | | |
| M2 | Every genre has tagline, 3 listen-for lines, 5 hallmarks, 3–5 artists, 3 landmark recordings, neighbours and sources | data-evals script | 100% | | |
| M3 | Each landmark recording opens a search for that exact recording in a new tab, in one click | user-tester | 3 of 3 sampled | | |
| M4 | Switching Philosophy ↔ Music keeps each field's view and progress apart; reload keeps the field | user-tester | yes | | |
| M5 | Music content accuracy: every claim graded against the saved sources | data-evals | 0 wrong, 0 invented links, ≤ 2% unsupported after fixes | | |
| M6 | Philosophy unchanged: all existing tests pass; 3 schools spot-checked | PM + user-tester | yes | | |
| M7 | Phone 390×844: open a genre, play a recording, switch field | user-tester | nothing cut off, targets ≥ 44 px | | |
| M8 | Coverage: the field's list checked against at least three outside references by a grader that didn't build it (feedback 48) | independent grader | no "must add" item missing, or each one logged as a decision | | |

**User test (job 2, the thread):** from House, say where it came from and name two genres it led
to, then open one of them. Bar: 3 of 3 runs, under 2 minutes each.

**Design critic:** the genre card and the field switcher, fixed five-point scorecard. Target 9/10,
not a blocker.

**Guardrails:** no copyrighted audio hosted or embedded; no lyrics quoted; 0 model API calls;
weekly usage stops new work at 70%.

## Phase 5: a globe you spin (28 Nov, Founder mode, L61)

Run by `user-tester`, `data-evals`, `design-critic` and independent graders; never by the
builder. Laptop 1440×900 and phone 390×844.

| # | Check | Run by | Bar | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| S1 | Any genre or school reachable from first open (replaces M1's "all visible"), for the picked globe | user-tester | ≤ 2 actions, 5 of 5 sampled | | |
| S2 | Front-half labels: rim, overlap, dot and title checks across spun views (8 rotations per field) | script, run by PM | 0 problems | | |
| S3 | Drag spins with inertia; a click turns the item to the front; keyboard arrows spin; reduced motion turns inertia off | user-tester | yes, laptop and phone | | |
| S4 | Phone: dragging the globe never scrolls the page; targets ≥ 44 px | user-tester | yes | | |
| S5 | Calmer: labels on screen at once on the music globe | script | ≤ 60% of today's | | |
| S6 | Coverage for the new genres and classical: M8 against at least three outside references | independent grader | no "must add" missing, or logged | | |
| S7 | New content: M2 shape and M5 accuracy | data-evals | 100%, 0 wrong, ≤ 2% unsupported | | |
| S8 | Timeline from about 1600: pre-1900 band compressed, 1900 onwards as before, no label overlaps | script + user-tester | 0 problems | | |
| S9 | Philosophy on the new globe: tests pass, 3 schools spot-checked | PM + user-tester | yes | | |

**User test (job 1, reworded):** "Find pop and say what sits next to it", then "find a genre you
haven't heard of and open it". Bar: under 30 s each, and the tester says whether the hidden back
half cost them anything.

**Design critic:** the picked globe, fixed five-point scorecard. Target 9/10, not a blocker.
