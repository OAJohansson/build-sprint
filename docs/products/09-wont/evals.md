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
| R1 | | | user-tester | pass / fail | screenshot / log |

### User test (from `user-testing/plan.md`)

| Scenario | Bar: time | Bar: taps | Bar: outcome | Result |
| --- | --- | --- | --- | --- |
| S1 | ≤ s | ≤ | | |

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
| | | | |

### Build hygiene

- `pnpm -F NN-slug build` and `pnpm -F NN-slug lint` pass; `pnpm -F NN-slug test` passes if the
  kickoff pack named unit tests.
- No secrets in the diff; every new key is in `.env.example`.

Owner-only checks: Part 2 of `docs/operating-modes/evals-TEMPLATE.md`, kept outside the repo.
