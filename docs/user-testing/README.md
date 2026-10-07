# Simulated user testing

A repeatable way to get user feedback on a product before real people see it. An AI agent takes on
a defined persona, uses the live app in a phone-sized browser to do realistic tasks, and reports
what got in the way and what was actually worth having. It doesn't replace real users. It catches
the obvious problems first, so real tests are spent on what only real people can show.

## The loop (per product)

1. **Persona**: copy [`persona-TEMPLATE.md`](persona-TEMPLATE.md) to `NN-slug/persona.md`. One
   specific person: context of use, goals, frustrations, what "worth it" means to them.
2. **Plan**: copy [`plan-TEMPLATE.md`](plan-TEMPLATE.md) to `NN-slug/plan.md`. Scenarios written as
   the persona's real moments ("coach says 70%…"), each with a success bar (time, taps, outcome),
   plus how to run the app for testing (start command, seed data, what to mock).
3. **Run**: start the app, then run the `user-tester` agent
   ([`.claude/agents/user-tester.md`](../../.claude/agents/user-tester.md)) with the persona and plan.
   It drives the app scenario by scenario, thinks aloud, and screenshots each step.
4. **Report**: the agent writes `NN-slug/report-YYYY-MM-DD.md` in a fixed format: a verdict per
   job, findings by severity, a value assessment, progress, and top recommendations.
5. **Triage**: add the findings to the product's feedback log (`docs/feedback/NN-slug.md`) next to
   the owner's own review, then prioritise everything together.
6. **Real users**: test the same scenarios with 1–3 real people. Note where the simulation was
   right, wrong or blind, and improve this README, the templates or the agent (see below).

## Why this shape

- **One persona, real moments.** Generic "usability" reviews find generic issues. A persona in
  their context (sweaty, between sets, 30 seconds) finds what matters.
- **Value, not only friction.** Every report asks which features earn their place for this person,
  and which are noise.
- **Evidence.** Findings point to a scenario step and a screenshot, not opinions.
- **Same scenarios for agent and humans**, so results compare.

## Known limits of the simulation

- No real hands, mic, sunlight or gym noise. Dictation and AI parsing are simulated, so judge
  their *flow*, not their accuracy (test accuracy separately, e.g. an eval of real notes).
- The agent knows how apps work and reads every word. Real users skim, guess and give up sooner.
- It can't feel long-term value (habit, motivation over weeks). Seeded history approximates it.

## Improving the system

After each real-user round, add one line under **Method learnings**: what the simulation missed or
overweighted, and what changed in the templates or agent because of it.

### Method learnings

- (none yet)
