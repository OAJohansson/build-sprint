# Evals: Wont

How the owner will judge the delivery (decision 0026). Written at kickoff, before any code, in
two parts that never live together:

- **Agent-checkable checks** (this file, `docs/products/NN-slug/evals.md`): the squad reads them,
  runs them and reports each with evidence in the eval report.
- **Owner-only checks** (the second half of this template): copied **outside the repo** (e.g. a
  private note), never committed, never pasted into a session. The squad must never read them.
  They catch a delivery that passes its own checks but misses the point.

Whoever builds something never grades it: the checks below are run by `user-tester`,
`design-critic` and `data-evals`, not by the agent that built the thing.

---

## Part 1: agent-checkable checks

### Requirements (one pass/fail check per requirement in the kickoff pack)

| # | Requirement | Check (how to tell, on a fresh install) | Run by | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| R1 | Intro animation on first launch, skippable, replayable | Fresh storage: intro plays; Skip lands on the board; replay from settings plays it again | user-tester | | |
| R2 | Build habit as an if-then commitment with a daily goal | Create "After I wake up, I will get out of bed by 7:00": card shows anchor, action and goal | user-tester | | |
| R3 | Stop habit with trigger, friction step, replacement | Create "Nicotine pouches": card shows trigger and replacement | user-tester | | |
| R4 | One-tap log for today, saved | Tap a card once: logged; reload: still logged | user-tester | | |
| R5 | Stop habit logs clean day, slip (with size) and urge separately | Log each once: three distinct entries in history | user-tester | | |
| R6 | A miss never resets progress to zero | Seed 6 kept days then a miss: main number dents (e.g. 6 of 7), never shows 0 | user-tester | | |
| R7 | Gentle comeback message after a missed day | Seed yesterday as missed, open: message with one next step; no words from the not-list | user-tester | | |
| R8 | First kept day after a miss marked as a comeback | Log today kept after a seeded miss: comeback mark visible | user-tester | | |

### User test (from `user-testing/plan.md`)

| Scenario | Bar: time | Bar: taps | Bar: outcome | Result |
| --- | --- | --- | --- | --- |
| S1 Log this morning's wake-up | ≤ 5 s | ≤ 1 | logged, small celebration | |
| S2 Set up a new build habit as a commitment | ≤ 60 s | ≤ 8 | card on the board | |
| S3 Log a pouch slip, then come back the next day | ≤ 20 s | ≤ 3 | slip saved, comeback message, no guilt words | |
| S4 Time passes: a week with two misses | — | — | numbers right, history intact | |

Every top job scored ≥ 4/5 by `user-tester`, and no blocker or major finding left open.

### Design

- `design-critic` score **≥ 9/10** on the main screen, from screenshots only, against the
  kickoff pack's "feel in one sentence".
- No item from the kickoff pack's "Things to avoid" visible on any screen.

### AI and data (only if the product has them; run by `data-evals`)

| Eval | Dataset | Metric | Bar | Result |
| --- | --- | --- | --- | --- |
| | n cases | | | |

### Guardrails (must not get worse; measured with a number)

| Guardrail | How measured | Bar | Result |
| --- | --- | --- | --- |
| Readable text | contrast ratio, worst state | ≥ 4.5:1 | |
| Correct data | saved vs typed, word for word | 100% | |
| Phone | works at 390 × 844, targets ≥ 44 px | yes | |

### Build hygiene

- `pnpm -F 09-wont build` and `pnpm -F 09-wont lint` pass; `pnpm -F 09-wont test` passes if the
  kickoff pack named unit tests.
- No secrets in the diff; every new key is in `.env.example`.

Owner-only checks: Part 2 of `docs/operating-modes/evals-TEMPLATE.md`, kept outside the repo.
