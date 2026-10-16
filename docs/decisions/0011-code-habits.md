# 0011 — Code habits: name what was skipped, label shortcuts, fix root causes, unit-test dates

- **Date:** 2026-10-13
- **Status:** accepted

## Context

The owner found the community skill "ponytail" (a "lazy senior dev" mode built on YAGNI: the
smallest change that fully solves the task) and asked whether it would help us build better. Most
of it repeats what we already have ("speed over polish", decision 0007, Claude's defaults). It
also lets Claude cut scope on vague requests by itself, which goes against the owner making the
product calls, and it triggers on every coding task alongside the design skills.

## Decision

Don't install the skill. Take its three best rules into AGENTS.md ("Code habits"):

- End each coding reply with one line on what was skipped or unchecked, and any risk.
- Label known shortcuts in code: `// shortcut: <the limit>, <when to upgrade>`.
- For a bug, find every caller first and fix the root cause once.

Add unit tests, but only for date, time and streak logic, the owner's call. Until now all our
testing was user-journey testing (playbook step 3b), and Mallow's time bugs only showed when the
tester let time pass. The starter template gets Vitest (`pnpm test`, `vitest.config.mts`); such
logic lives in a plain function in `src/lib` with a `*.test.ts` beside it and "now" fixed by
`vi.setSystemTime`. Existing apps aren't backfilled. Each brief gets a 5-minute **Unit tests**
pick (playbook step 1): 0–3 pieces of logic and their edges. The aim is learning to judge risk,
not zero bugs; speed still comes first.

## Alternatives considered

- Install the skill as-is: overlaps with what we have, makes scope calls silently, and adds a test
  rule we hadn't chosen.
- Install it at its `lite` level: asks before cutting, but still an always-on skill competing with
  the design skills for a handful of useful lines.
- Do nothing: loses the "what I skipped" line, which makes Claude's judgement calls visible.
- Unit tests for all non-trivial logic: more learning, but more time every day than a one-day
  build can spare. Starting with dates, where our bugs have been, tests the habit cheaply.

## Consequences

Claude's hidden judgement calls show up in each reply; shortcuts are searchable when a product is
picked up again; bug fixes take a few minutes longer; features with date logic take 5–10 minutes
more and break less. Vitest adds one dev dependency per app. Revisit at the next retro whether
the tests caught anything, and whether the closing line is read or has become filler.
