# 0026 — Operating modes: one pipeline, three settings

- **Date:** 2026-10-23
- **Status:** accepted; rolled out 23 Oct, first used on product 9

## Context

Eight products in, the owner decides almost everything, including things that teach nothing:
which branch, which worktree, how to resolve a merge conflict, why Vercel didn't deploy, where a
key lives. On 08 Selvedge that ops work (conflicts between parallel sessions, many branches,
Vercel, env keys) cost more attention than the product calls did, and made the day feel slow.
The owner still wants to learn by doing (playbook goals B, product craft, and C, technical), so
the answer is not "let the agents do everything", but "spend the owner's attention only on the
decisions that teach". Planned with the owner on 22 Oct; first use on product 9.

## Decision

### One pipeline, a dial with three settings

The playbook's steps stay the same in every mode (discover and frame, design, build, ship, test,
wrap up). What changes is **who makes which kind of decision, and when the owner is asked**.

| Mode | In one line | Owner's time |
| --- | --- | --- |
| **Learning** | As today: the owner decides almost everything, step by step, and is coached. | The whole day |
| **Streamlined** | The owner makes only the learning decisions, batched at four fixed gates. Toil is default-with-veto and logged. | Four gates plus the review |
| **Founder** | The owner writes a kickoff pack and evals; a PM session with specialist subagents delivers a PR plus an eval report. | Kickoff and the final review |

The mode is chosen at kickoff and written on the product card as `mode: learning | streamlined |
founder`. The dial can be turned **down** mid-product (Founder → Streamlined → Learning) when a
product turns out to need the owner closer, but not up: a product started hands-on has context
in the owner's head that a squad can't pick up.

### Three kinds of decision

| Kind | Examples | Learning | Streamlined | Founder |
| --- | --- | --- | --- | --- |
| **Learning** | Problem, user, jobs to be done, riskiest assumption, MVP cut, design direction, scope changes, architecture and real technical choices (a backend, a model, a data source) | Owner, as it comes up | Owner, at the next gate (sooner only if blocked) | Owner, up front in the kickoff pack; the PM decides the rest inside it and logs it |
| **Toil** | Copy, small UI fixes, minor bugs, naming, ordering of a list | Owner | Claude, default-with-veto, logged | PM, logged |
| **Ops** | Branches, worktrees, commits, pushes, merge conflicts, deploys, env keys, lockfile | Claude | Claude | Claude |

**Ops is never the owner's, in any mode.** Claude handles it and reports only when something
needs the owner's account or money (a login, a paid plan, a key only they can create). A scope
change is always a learning decision, in every mode: widening past the stop line goes to the
owner (playbook step 2, "re-cut on every scope widening").

When unsure which kind a decision is, treat it as learning in Learning and Streamlined, and as
the PM's call (logged) in Founder.

### Gates

| Gate | Learning | Streamlined | Founder |
| --- | --- | --- | --- |
| **Kickoff** (problem, user, jobs, riskiest assumption, success, MVP and stop line, mode) | Worked through together | One decision sheet; Claude drafts, owner decides | Owner writes the kickoff pack and evals alone |
| **Design pick** (one of three directions) | Together, through `/design-session` | Decision sheet with the three screenshots and the critic's scores | PM picks against the kickoff pack's feel references; logged |
| **First working version** (core job works end to end) | Continuous | Decision sheet: anything that changes the cut, plus the toil log so far | None |
| **Final review** (PR, user test, success check) | Together | Decision sheet plus the full decision log | PR, eval report and the owner-only checks |

Between gates in Streamlined, Claude does not stop for learning decisions it can defer: it
queues them for the next gate and keeps building on the most reversible option, marked as
provisional in the journal. It stops early only when the next step depends on the answer.

### The decision sheet

One message (and a copy in `journal.md`) per gate, so the owner can answer in a minute:

```markdown
## Gate: <name>, <date>

1. **<Question in plain words>** (learning: <which kind, e.g. MVP cut>)
   - A. <option> — <trade-off in one line>  ← recommended, because <one line>
   - B. <option> — <trade-off>
   - C. <option> — <trade-off>
   Practice: <the practice behind it and who it comes from>
2. ...

Toil decided since the last gate (veto any by number): T4, T5, T6 (see decision log).
```

Each question gives a recommendation and the reason, so the owner learns the judgement as well as
the answer; the coaching rule in `AGENTS.md` still applies.

### Default-with-veto

For toil, Claude decides, does it, and logs it in one line, without asking:

```markdown
- **T7** Empty state copy: "Nothing saved yet" (was "No items"). Veto: revert the copy.
```

The owner can veto any T-number at any time ("veto T7"); a veto is undone at once and noted.
Vetoes are the learning signal: three vetoes of the same kind mean that kind is not toil for this
owner, and it moves to learning decisions for the rest of the product.

### The decision log

Every decision in Streamlined and Founder, of any kind except ops, is logged in the product's
`docs/products/NN-slug/decisions.md`: number (L1, L2… for learning, T1, T2… for toil), date, the
decision, who made it (owner, Claude, PM), the gate or step, and later its outcome (kept, vetoed,
changed). At wrap-up the retro reads the log: which defaults the owner would have made
differently, and which learning decisions turned out to matter. That is the loop that tunes the
dial.

### Founder mode: the PM and the squad

**The PM is the main Claude Code session**, not a subagent: it holds the kickoff pack, owns the
plan and the decision log, does the ops, and is the only one that talks to the owner. It:

1. Reads the product's kickoff pack and agent-checkable evals (`docs/products/NN-slug/kickoff.md`
   and `evals.md`, from the templates in `docs/operating-modes/`). The owner-only checks live
   outside the repo; the PM never asks for them and never hands them to a subagent.
2. Turns them into a brief, a persona and a test plan (with the `discovery` agent), and stops to
   ask the owner only if the pack contradicts itself or leaves the riskiest assumption untestable.
3. Runs the squad in the playbook's order, one specialist at a time (one squad, because of usage
   limits): `discovery` → `designer` (scored by `design-critic`) → `full-stack-engineer` →
   `user-tester` and `data-evals` (AI or data products only) → fixes → re-check.
4. Decides learning questions the pack doesn't cover, inside the pack's appetite and no-gos, and
   logs each one as an L-number with its reason, so the owner can review them.
5. Delivers a PR and an eval report: every agent-checkable check with pass/fail and evidence,
   the critic's score, the user-tester's numbers, the guardrails, the decision log and what it
   skipped. Then the owner runs the owner-only checks.

**Whoever builds something never grades it.** The designer is scored by `design-critic`, never by
itself; the engineer's work is checked by `user-tester` and `data-evals`, never by the engineer;
the PM reports the graders' results, not its own opinion. Graders get the artefact and the
checks, not the builder's reasoning.

The squad's agents live in `.claude/agents/`: `discovery.md`, `designer.md`,
`full-stack-engineer.md`, `data-evals.md`, next to the existing `design-critic.md` and
`user-tester.md`.

### Ops groundwork shipped with this decision

- A project allowlist in `.claude/settings.json` for routine git, pnpm, gh and vercel commands,
  so ops doesn't stop for permission prompts. Nothing destructive is on it: no force push, no
  `reset --hard`, no `rm -rf`, no deleting remote branches, no `vercel remove`.
- `pnpm env-bootstrap NN-slug`: fills an app's `.env.local` from one git-ignored file at the repo
  root (`.env.secrets.local`, covered by the existing `.env*.local` rule), using the app's
  `.env.example` as the list of keys. It never prints values and only overwrites an existing value
  with `--force`. Keys stop being copied by hand from the previous app.
- A light `checks` GitHub Action on every PR to `main` (owner call 2 below).

## Owner calls (decided 23 Oct)

1. **Product 9 runs in Founder mode.** Claude had recommended Streamlined; the owner chose
   Founder to try the full pipeline. The dial can still be turned down mid-product.
2. **Claude merges its own PRs once checks pass.** This is a standing approval. The owner gives
   up their last look before code goes live, and accepts that risk because there are no real
   users yet, so a broken live site costs little. Revisit when a product gets real users.
   - "Checks pass" means the `checks` GitHub Action (`.github/workflows/checks.yml`) is green.
     It is deliberately light: for each app the PR changed it runs lint, unit tests and
     `next build`, which includes the TypeScript check and catches most "won't deploy" errors
     before Vercel does. It also checks that the repo scripts parse. Builds need no keys. A
     docs-only PR passes in seconds, and Actions minutes are free on a public repo.
   - No checks, no merge: if the PR has no green `checks` run, Claude asks the owner instead.
   - Merges are still batched (about once or twice a day, decision 0016), because each merge
     costs deploys, and Claude republishes the notebook from `main` after each merge as before.
3. **Previews only for the owner's big checks; no branch previews.** Decision 0016 stands:
   branch pushes deploy nothing. When the owner reviews something big, Claude makes one
   deliberate preview with `vercel deploy` from the app's folder (preview, not production, so
   one deployment from the daily 100) and sends the link:
   - Founder: once, for the final review.
   - Streamlined: at the design pick (if the directions need a phone to judge) and at the final
     review.
   - Learning: only when the owner asks.

## Rolled out after 08 Selvedge (23 Oct)

The pieces deferred while Selvedge had these files open:

- **Playbook** step 0 (the dial, the kinds of decision, the gates) and a gate note at each step;
  **`AGENTS.md`** "Operating modes" (the rules per mode and the PM's behaviour) and "Parallel
  sessions and ops".
- **`pnpm new --mode`** writes `mode:` on the card (default `learning`) and, for Streamlined and
  Founder, creates `kickoff.md`, `evals.md` (part 1 only; part 2 never enters the repo) and
  `decisions.md`. The notebook shows them as Kickoff pack, Evals and Decisions sub-pages.
- **Ops rules:** one worktree and one branch per product (a spike is a commit); Claude merges on a
  green `checks` run; `pnpm ship` fills `.env.local` from `.env.secrets.local` first and Claude
  runs it; `pnpm ship NN-slug --preview` makes the one deliberate preview.
- **Shared docs written once:** during a product, entries for the knowledge bank, problems,
  learnings and the playbook go under `## To carry over` at the top of the journal, and are
  written into the shared files in one commit at wrap-up, after merging `main`. `README.md` is
  generated, so a conflict is solved by taking `main`'s and running `pnpm sync`.

## Alternatives considered

- **Three separate systems** (a Learning playbook, a Founder pipeline…): more to maintain, and
  moving between them mid-product would mean starting over. One pipeline with a dial keeps one
  set of steps and templates.
- **Founder mode for everything**: fastest, but the owner stops learning product craft by doing
  it, which is the point of the sprint (goal B).
- **Keep Learning and just fix ops**: fixes the worst pain, but keeps the owner stopping for toil
  all day. Ops fixes ship first anyway, because they help every mode.
- **Several squads in parallel**: tempting, but usage limits and merge conflicts make one squad
  the safe start.

## Consequences

- The owner's attention goes to the decisions that teach; the log makes Claude's defaults
  reviewable instead of silent.
- More rides on the kickoff pack in Founder mode: a vague pack gives a confident wrong product.
  The owner-only checks are the guard against a squad that games its own evals.
- Gates add some waiting in Streamlined; the most-reversible-option rule keeps building moving.
- Revisit after product 9's retro: did the gates catch the right decisions, and how many toil
  defaults were vetoed?
