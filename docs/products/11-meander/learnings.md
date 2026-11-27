# Learnings

What building this product taught me.

## Retro

**Numbers**
- **Time:** planned one day; kickoff to merge took two working days (12–13 Nov), then the merge waited 12 days for my yes (25 Nov).
- **PRs:** two for Meander (#97 empty starter, #100 first working version), plus #98 for the notebook split it triggered.
- **Design:** 4 rounds (10 rough directions → 3 elevated → the Clew fix pass → all states), then 2 canvas rounds with 7 of my comments.
- **Content:** 23 schools, 88 thinkers, 56 links, 855 graded items. Four grading rounds: 3 wrong and 282 unsupported in round 1, then 0 and 16, then 1 and 6, then 0 and 0. About $28 of judge calls before my API account hit its limit.
- **Bugs and who found them:**
  - Content grader: 3 wrong claims and 282 unsupported ones.
  - The writer's own check: one invented Mill quote.
  - Critic: 6 findings on the built app.
  - Simulated user: 8 findings (2 major).
  - Layout check: overlaps after the link set changed.
  - Me: the build broke on the tagline format, and so did the notebook publish.
- **Unit test:** pointed at the right logic (visit-day counting, midnight split). It passed every time and caught nothing, and the user test confirmed the midnight split on seeded data.

**Keep**
- **The canvas sign-off.** My comments in place (progress off the globe, no "Whole field" pill, themes in the card, no welcome line) changed the design before a line of UI code.
- **A content pipeline where the builder never grades.** Full-text sources were saved, every item carries a citation, and a separate grader checks claim by claim. It turned "looks right" into "checked right".
- **Running two agents side by side.** The writer and the engineer worked in parallel, joined by a re-runnable import, so content fixes dropped in without code changes.

**Change**
- **Brief the first design round for calm.** Ten directions at once came back dense and wordy, and I got a headache. The first brief should set density rules: few words, large type, one focal point.
- **Keep the evals in step with design decisions.** The user tester marked R2 and R6 as failing because the evals still said "2–3 neighbours" and "Esc to the overview" after the design had moved on. Reconcile them at the canvas sign-off.
- **Plan the grading budget.** The grader ran on my own API key and hit its usage limit halfway, so about 195 items were graded in-session instead. Estimate the cost first and check the key's limit before a big grading run.

**Try next time**
- For a content-heavy product, build the accuracy pipeline (sources → writer → grader) before the design rounds, so the design uses real content from the start.
- Re-run the user test after the fix round, not only before it.

**What surprised me**
- Even with the sources in hand, about one claim in ten was unsupported, and a famous quote slipped in that isn't in the cited text.
- A web summary invented a fact (Kant holding a chair at Jena) on its own.
- The globe layout was fragile: removing one link changed overlaps across many focuses, so the layout check has to run after every content change.

**Growth**
- **A (building good products with AI):** trust in AI-written content comes from a pipeline (sources, citations, an independent grader, a hand spot-check), not from a better prompt.
- **B (product craft):** naming the riskiest assumption (value: will I hop?) kept the MVP small, with no live AI. The user test then pointed straight at the next bet: "next on your thread".
- **C (technical):** laying out a graph on a sphere and placing labels is a cost-minimisation problem. Settings that look close can give very different results, so you tune with a grid and a scripted check, not by eye.

**Decision log, read back**
- **Mattered most:** L4 (riskiest assumption is value), L6 (no live AI in the MVP), L14 (sourced content with evals), and L10–L12 (my canvas comments).
- **Defaults to look at again:**
  - T15: Harriet Taylor Mill replaced Butler and Fraser in Feminist Philosophy only because the encyclopedias lacked entries for them.
  - T20: the evals were reworded to match the design rather than the design changed.
  - T9: the desktop is a fixed 1440×900 layout scaled to the window.

**Process changes carried forward** (logged in `docs/learnings.md`)
1. The first design round's brief sets density rules for "calm at first glance" (playbook step 1).
2. At the canvas sign-off, reconcile `evals.md` and the brief's requirements with the approved design (playbook step 1).
3. For AI-written content: a saved source corpus, a citation on every item, an independent claim-by-claim grader, and a cost estimate plus API-limit check before grading runs (playbook step 3b).

## Retro, phases 2–3 (27 Nov 2026)

**What happened:** the Existentialism pilot article (with an apply section and a beginner rewrite), research on learning, the school skeleton (four design rounds and a canvas sign-off), then, with the owner away, the timeline, Your thread as progress, further reading and the first four Eastern schools. The owner's verdict: "a good first MVP".

**What worked**
- Research before design: the advance-organiser and pre-training evidence shaped the skeleton and kept it small.
- Clickable prototypes: once the owner could click, decisions came fast ("none speak to me" → P6 → P7 in one round).
- The canvas threads: four comments, three of them resolved with three quick options each, in minutes.
- The grader loop on every new fact type: places, spans and the Eastern schools all came back with real errors that were fixed before anyone saw them.

**What didn't**
- The first design round replaced the globe the owner loved with flat pages: "I kind of hate all of them". Start from what the owner already likes.
- Critic scores on stills pointed the wrong way (A3 over A1).
- Running on my own let the globe and Your thread grow busy. The owner wants a planning session before more features.

**Try next time**
- Bring the owner's current favourite into round 1 of the design as the baseline to beat.
- Give critics prototypes, not stills, when the design moves.
- When running autonomously, add one "does it still feel calm?" check after each slice, not only at the end.

**Growth**
- **A:** a phase run on my own (with the owner's brief, a budget guard and every call logged) delivered four slices and a graded content batch for about 4% of a week.
- **B:** product calls as decisions with reasons (L34–L42) made the review quick, and left the owner free to redirect (#43–#46).
- **C:** stable re-layout (spring anchors instead of freezing) and placing labels by their visible text.
