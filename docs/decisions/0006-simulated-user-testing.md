# 0006 — Simulated user testing before real users

- **Date:** 2026-10-07
- **Status:** accepted

## Context

Day 1's first build logged workouts well, but the owner's review showed it missed what the user
actually needed (recalling PBs, seeing progress). With 20 products in 20 days there's no time to
recruit real testers for every iteration, but shipping without a user's view repeats that mistake.

## Decision

Every product gets a simulated user test once its core flow works:

- A persona and a scenario plan per product (`docs/user-testing/NN-slug/`), from shared templates.
- A `user-tester` agent (`.claude/agents/user-tester.md`) plays the persona and drives the real app
  in a phone-sized browser, with screenshots as evidence, and writes a fixed-format report: jobs,
  scenarios, findings by severity, value, progress, top recommendations.
- Findings join the owner's review in `docs/feedback/NN-slug.md` and get prioritised together.
- Real users then test the same scenarios. Where the simulation was wrong, the templates or agent
  get fixed (recorded in `docs/user-testing/README.md` → Method learnings).

## Alternatives considered

- Heuristic review only (a checklist): fast, but generic. It doesn't ask "is this worth it for *this*
  person?"
- Real users only: the best signal, but slow to arrange daily, and wasted on obvious problems.

## Consequences

- About 30 minutes per product, and a growing, comparable record of user insight across products.
- The simulation can't judge mic or AI accuracy, physical context or long-term motivation; those
  stay for real tests and evals.
