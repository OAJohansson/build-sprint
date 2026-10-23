# Operating modes

One pipeline with a dial: Learning, Streamlined, Founder (decision
[0026](../decisions/0026-operating-modes.md)). This folder holds the templates the modes add on
top of the brief and the user-testing templates.

- [`kickoff-TEMPLATE.md`](kickoff-TEMPLATE.md) → `docs/products/NN-slug/kickoff.md`: today's brief
  plus feel references, things to avoid, appetite and mode. Founder mode starts from it;
  Streamlined decides it at the kickoff gate.
- [`evals-TEMPLATE.md`](evals-TEMPLATE.md) → `docs/products/NN-slug/evals.md`: the agent-checkable
  checks. Its second part, the owner-only checks, is copied somewhere outside the repo and never
  committed.

Not yet wired into `pnpm new` (deferred until 08 Selvedge ships): copy the templates by hand for
now.
