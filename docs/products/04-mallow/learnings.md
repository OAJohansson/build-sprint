# Learnings

What building this product taught me.

*Retro drafted by Claude from the journal, feedback log and test report, 12 Oct. The owner was
too tired for a phone review at wrap-up: the "What surprised me" and growth lines are drafts to
put into your own words.*

## Retro

**Numbers:**
- **Time:** planned one day; took one long day (12 Oct). Discovery ~1 h as planned; two prototype
  rounds; first deploy in the afternoon, later than the playbook's "at lunch".
- **PRs:** 3 (#29 discovery, prototypes and app; #31 summary in the app, PDF cut; #32 testing round).
- **Findings: 19 logged.** Audit: 2 (1 won't do). break-ui: 8. Simulated user: 10 (4 major). Owner:
  the PDF cut and the three calls on the majors. 18 fixed, 1 won't do, 0 open. The owner's own phone
  review didn't happen (to-do).
- **Guardrails measured:** 17 of 17 summary values correct; 0 health claims; 0 network requests with
  health data; dose 2 taps, relief 1 tap, check-in ~20–25 s; setup ~80 s (target 60).

**Keep**
- Researching today's alternatives before the brief: Montu's public site had no symptom tracking,
  the registry showed heavy drop-off, and Calyx proved "a tracker" alone isn't an edge. That moved
  the bet from logging to the summary for the 15-minute call.
- Pushing back on "two-sided": building the patient side plus a summary gave the clinic its
  evidence without building a clinic product.
- Real references from the owner's own work (Vinehealth) before prototyping: plain-word grades and
  "last time you mentioned…" became the relief question that needs no notifications.
- Testing in order, and asking the owner to make the calls on the majors rather than fixing silently.

**Change**
- Deployed late. The first live URL came after two prototype rounds and the promotion, so the
  phone never saw the app while it was being shaped.
- A brief requirement (the check-in note) existed only in the demo data; nothing caught it until
  break-ui. Demo data hides missing features.
- The test plan didn't let time pass, so resume-without-reload and a moved appointment were found
  only because the tester improvised.

**Try next time**
- Ship the empty starter in the first hour, so every later change is seen on a real phone.
- Walk the brief's requirements on a fresh install, not on the demo.
- Give every test plan a "time passes" scenario.

**What surprised me** *(draft: put it in your own words)*
- Product: the most useful screen for the clinic is the plainest one, a summary in words, not the
  calendar or the plant.
- Design: the plant worked best unexplained. Naming it ("blooms when you see your doctor") made it
  odd; left quiet, it's a small delight.
- Technical: "opening the app" on a phone usually means resuming it, not loading it; logic that runs
  once on load misses most real visits.

**Growth:** *(draft)*
- **A, product:** a health product for someone else's problem, where the edge came from the moment of
  use (the 15-minute call), not from the logging.
- **B, product craft:** today's-alternatives research changed the bet; scope cuts made out loud (PDF);
  the owner made the calls on the test's majors.
- **C, technical:** separate storage for demo and real data; dates as calendar strings with UTC maths;
  re-checking state on `visibilitychange`; deterministic demo data from a seeded generator.

**Process changes carried forward** (max 3, logged in `docs/learnings.md`)
1. Ship the empty starter in the first hour (`pnpm ship` right after `pnpm new`), not after the design.
2. Test plans include a "time passes" scenario: resume without reload, cross midnight, cross a key date.
3. Before testing, walk every brief requirement on a fresh install, not the demo.

## v2 (20 Oct)

- **Evidence from the log, not from asking.** Moving "is it working?" from per-dose relief to
  daily grades over time, with the medicines on the same axis, made relief optional and the
  summary more honest. The app shows change next to what was taken; the doctor interprets.
- **A design brief in one sentence.** The owner's "how the symptoms changed and what they were on"
  decided every cut the critic suggested: dots only over 4 weeks, the takeaway above the graph,
  medicine names instead of colours.
- **Guardrails need a grep, not just good intentions.** The one breach ("How quickly it works")
  was in a heading written after the copy review; placeholders like "Flower T22" looked like real
  products. Keeping all copy in one file (`forms.ts`) made the check one read.
- **Time is still where bugs hide.** The "time passes" test with a fake clock found a stale
  "Noted" line after a plan day ended and confirmed the 04:00 plan day; the unit tests covered the
  logic, the browser test covered what the user sees.
- **Process:** the ship script deploys `main`, and a skip check that crashes looks like a broken
  app; fixing it once in every app and the template beat patching Mallow alone.
- **The first sentence wins.** In the Priya test, a caption that gave a level ("mostly quite")
  hid a real improvement that the line and the Summary showed. Same words weren't enough to fix it:
  two screens must also measure over the same window, or rounding at a threshold makes them
  disagree again ("better" vs "a little better").
- **Defaults are suggestions.** Prefilled amounts and dates were the near misses the guardrail
  check didn't catch: no string advised a dose, but a starting number did the same job.
