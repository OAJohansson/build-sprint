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
| R2 | A school shows questions, themes, 3–5 thinkers, what it reacted against, 2–3 go-next neighbours; each theme opens in place with 2–3 sentences and its thinkers | Every school in the data has all of these (script); 3 schools spot-checked on screen | data-evals + user-tester | | script output, screenshots |
| R3 | Choosing a neighbour opens that school | One click from Existentialism reaches a neighbour; the globe turns to face it | user-tester | | screenshot |
| R4 | A thinker shows a summary and key ideas; "Study with Claude" copies a prompt naming the thinker and says so | Paste the clipboard: the prompt names the thinker; button reads "Copied" | user-tester | | clipboard text |
| R5 | Opened schools and thinkers are marked as visited, with the date, and survive a reload | Open two, reload: both rings still there; "Your thread" lists them with the right dates | user-tester | | screenshot |
| R6 | From any level, Esc, empty space or the logo return to the overview | Tested from a school, a thinker and an open theme | user-tester | | log |
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
