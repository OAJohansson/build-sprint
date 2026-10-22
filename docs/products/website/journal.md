# Journey

What happened, what was decided and why. Newest last.

## 2026-10-22

### Why a website, and why now

I want a personal website that shows my CV and the 20 products. Selvedge (08) is still being
built, so the website gets its own worktree and branch (`website`) and touches only its own files.

### Naming: not "the portfolio"

"Portfolio" was getting confused with the 20 products themselves. From now on: the **Andreas
Product Portfolio Website** (or "the website") is the site; "the 20 products" is the sprint.

### A side project, not product 09

Same playbook and roles as a sprint product, but it doesn't count toward the 20. It sits under
"Alongside the sprint" in the notebook. `pnpm new` got a `--side` flag for this (decision 0023).

### Start from scratch

The day-0 `apps/portfolio` skeleton still built, but its shape was decided before any discovery.
Deleted it and scaffolded `apps/website` fresh, so the brief decides what the site is.

### Next: Discover and frame

Brief first, no code: problem, who, jobs, today's alternatives, riskiest assumptions, success,
MVP and stop line.

### Who it's for

Owner's answer: a hiring manager for a product role who got my CV and opens the link on their
phone between meetings, and should come away wanting to talk to me. Not only AI roles: the site
has to show an exceptional product manager, through its own UX/UI and creativity as well as
the content (who I am, CV history, product portfolio). Written into the brief's Problem, Who and
Moment of use.

### First content ideas (a jump to solution, parked in the brief)

Asked about today's alternatives; the owner answered with content instead: an About me (CV,
career background) and Projects, led by GambleAware and Vine Health (the strongest career
examples, with visuals) plus the sprint products. Open question: one projects section or two.
Captured as a draft in the brief's MVP, to test against the jobs once they're written. New
risks noted: whether creative UI slows a phone reader, and whether employer work can be shown.

### The gap the website fills

Owner: today a hiring manager can't see how I think about product. The site should show, in very
simple terms, the problems I solved, the decisions I made, the users we served and their outcome,
with visuals and the metrics I moved. Two more signals: product taste (a nice site, and products I
designed) and evals (AI work needs them). Turned into a sharper Problem, today's alternatives
(CV/LinkedIn vs a screening call) and four draft jobs for the owner to rank.

Risk question: public GambleAware and Vine Health material (website, own published posts) is the
plan, credited. Internal metrics are the real risk; to be checked. Eval evidence exists in
Inkling and Folio only.

### Jobs ranked

Owner's order: product thinking, taste, AI judgement (evals), quick feel. Quick feel is last
because the metrics are already in the CV summaries; they still appear wherever an outcome is
told. This sets up the design's main tension: the top job usually needs reading, but the moment
is a phone and a minute or two.

### What success looks like

Owner: more replies can't be credited to the site (too much else varies), but interviewers
bringing up something from it shows they read it and are interested. Pre-mortem: they'd leave
because it wasn't engaging or had too much information. They'd like analytics to see clicks and
time per section. In the brief: main outcome (curious before the call), three signals (mentions
in interviews, link opened via a per-application tag, visits that go past the first screen), a
"not too much information" guardrail, and analytics noted as a rabbit hole (free Vercel
analytics has no click events; cookie-based tools need a consent banner). Targets are the
owner's to set.
