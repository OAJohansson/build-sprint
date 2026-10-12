# Learnings

What building this product taught me.

- **A redesign makes the existing strength visible.** The AI already named an idea in every reply
  and saved it; inside a chat bubble nobody noticed. Its own screen ("You met an idea") was the wow,
  and the cheapest feature to build.
- **Discovery has a quality, not just a size.** Sixteen competitor write-ups and a research pack
  still contained zero conversations with users. Say "research suggests", not "users told me".
- **Real data disciplines the design.** Wiring the screens to real data showed the design wanted
  things the data didn't have (a next step, idea sources). Changing the demo to match kept it honest.
- **One data shape, two sources.** Screens read from a source: the real API or a scripted demo. A
  public demo that can't touch the database or steer an AI, and no screen built twice.
- **Simulated users find trust bugs.** Saved entries were cut short, and the demo didn't say its
  replies were scripted. Both would have cost trust; neither showed up in the audit.
- **A model change is a behaviour change.** Moving to the Claude API kept every safety behaviour
  but broke two prompt rules (one question; no question in the closing poem). The evals caught both.
- **Progress without punishment.** For 16–17s (Children's Code) and for retention, progress is your
  thinking changing over time, not streaks or counts you can break.

## Retro

**Numbers:**
- **Time:** planned "a few hours" (fixed appetite); actual about 3.5 hours of work (first commit
  11:23, last 13:59, plus discovery and the brief before).
- **Scope:** grew twice by owner choice (one screen → the whole app; free writes separate), plus a
  provider switch (OpenRouter → Claude API).
- **Output:**
  - 27 commits on one branch, one PR.
  - 131 files changed; the old chat UI removed (lint errors 16 → 0).
  - Unit tests 126 → 138; AI evals 6/8 → 8/8.
- **Findings:** 29 logged, 26 fixed, 2 parked, 1 kept on purpose.
- **Bugs, and who found them:**
  - *Me, building:* a font that pointed at itself; an unlabelled wordmark; a navigation race
    (the takeaway idea opened Today).
  - *Me, at deploy:* the preview's 500.
  - *Simulated users:* entries cut short; an unlabelled scripted demo; contrast (both testers).
  - *Break-ui:* Arabic punctuation on the wrong side.
  - *Evals:* two prompt rules on the new model.
  - *The owner:* the Supabase SQL editor's login failure.

**Keep**
- References and "what not to do" before `/prototype` (03's process change): four directions, none
  literal.
- Two personas for a demo product: the user (Maya) and the audience (a hiring manager). Each found
  what the other missed.
- Evals as the gate for a model or prompt change; record the run in a QA note.
- Listing carried behaviours as owner decisions (03's change): it caught "Keep" and "next step"
  promising things the data couldn't do.

**Change**
- Scope grew without a fresh appetite. Each "can we also…" was reasonable, but "a few hours" became
  the whole app plus a provider switch. Re-cut out loud at every widening request, not once.
- Tests ran out of the playbook's order (users before the audit, because Supabase was blocked).
  Both testers re-found contrast and tap targets that the audit had already flagged.
- Status bookkeeping drifted: four fixed items still said "open" until wrap-up.

**Try next time**
- Open the preview link before building features, to surface missing Preview keys early.
- In every journaling or data-entry test, compare what's saved with what was typed.
- For any demo-style test, ask "what did you think was real?" after the run.

**What surprised me**
- How much existed already. The AI was carefully built, with stances, crisis handling and evals; the
  product problem was entirely presentation.
- The idea name that worked as research ("identity foreclosure") landed as clinical, and as
  mortgages, for a law student. Research can't tell you that; a user can.
- The preview 500 came from the demo still running the sign-in check it didn't need.

**Growth**
- **A (product):** a two-minute demo is an argument: learning → decision → screen. Design the demo
  path as carefully as the app.
- **B (product craft):** an inherited discovery has to be audited for *what kind* of evidence it
  holds before it's quoted.
- **C (technical):** an adapter (one interface, two implementations) is how you get a safe public
  demo and real-data features from the same screens.

**Process changes carried forward** (max 3, logged in `docs/learnings.md`)
1. **Re-cut on every scope widening.** Playbook step 2: when a request adds scope past the stop
   line, name it as cut, swap or re-bet before building, and log it in the journal.
2. **Trust checks in every user test.** The test plan template asks the tester to compare saved data
   with what was typed, and, for demos, "what did you think was real?".
3. **Evals before and after any model or prompt change**, recorded in the product's QA or
   feedback (playbook step 2, building with AI).
