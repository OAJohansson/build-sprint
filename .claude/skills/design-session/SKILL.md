---
name: design-session
description: Run a design session for one screen together with the owner, in three phases. Discover pushes past AI defaults with seed strings and broad ideas, then /prototype. Define has a fresh-eyes critic subagent score screenshots until 9/10. Deliver subtracts, removes AI tells and hands the copy to a human. Only runs when called, as /design-session <screen>.
disable-model-invocation: true
---

# Design session

Adapted from Anshu Chimala, "How to turn your AI into a world-class designer" (Lenny's
Newsletter, Sep 2026), whose shape follows the Design Council's Double Diamond. Decision 0013.

**Why it works.** Language models drift to the safe, average answer, so AI design looks the same
everywhere. Three counter-moves: push off the defaults (Discover), get judgment from outside the
builder (Define), and subtract (Deliver). Taste stays with the owner: stop at every
**Checkpoint** and let them decide. Name the phase and the practice as you go, because the owner
is learning the method.

**House rule.** Clean and minimal (decision 0007) wins over any step here, the critic included.
Feel comes from still framing and sound, not per-keystroke motion.

## Before starting

- Scope: one screen per session. If asked for "the app", pick the screen that carries the main
  job, say why, and offer the rest as later sessions.
- Read the product's `brief.md`: jobs, moment of use, design references and what *not* to do.
  If there are no references, ask for 2–3 real ones (apps, objects, places) and a not-list first
  (playbook step 1). A feel is evoked, not drawn.

## 1. Discover: diverge

1. **Seeds.** Run `bash .claude/skills/design-session/seed.sh 4`. For each string, derive a direction
   from patterns in it (digits as hues or spacing steps, letter case as weight contrast, repeats
   as rhythm, its first character as the layout family). Never show the string in the design. A
   model can't be random on request; a real random input breaks it out of its defaults.
2. **Broad, not deep.** Write 8–10 one-line directions: the seed-derived ones, plus some inspired
   by the references or something far away (a museum wall label, a train timetable, a record
   sleeve). Include one or two that sound wrong; they sometimes win.
3. **Checkpoint:** the owner reacts, saying what they like and dislike in each. Sharpen their top
   three into short build prompts, using their words.
4. **Build** the three with `/prototype` (its picker and rules). Real data, not lorem ipsum.
5. **Checkpoint:** the owner picks one (or asks for a riff) and says in one sentence how it
   should *feel*. That sentence is the **intended aesthetic**, used for the rest of the session.

## 2. Define: the critic loop

1. Open the chosen screen in the browser pane at phone size (390 × 844), and screenshot the main
   state plus any key states (empty, a sheet open). The screenshot result names the saved file
   path; keep those paths.
2. Run the `design-critic` subagent with **only** the screenshot paths, the intended aesthetic
   and the references as words (or image paths, as a moodboard, not a template). Never the code,
   the conversation or the stopping score: it must judge what's on screen, not what we meant.
   Use the same wording every round.
3. Fix the gaps it names, biggest first, then screenshot again and rerun the critic.
4. **Stop** when it scores 9 or more. After two rounds, check that the score is rising; if not,
   stop and show the owner. Four rounds at most. Log each score and the top gap in the journal.
5. **Checkpoint:** the owner can overrule any critic note.

Images, shaders and video (the article's techniques 4–5) are not set up: they need a paid key
with a spend limit, in a gitignored `.env.agents`. If a screen truly needs them, raise it as an
owner decision with the cost.

## 3. Deliver: subtract and make it human

1. **Subtract.** For every element ask: what breaks if it's gone? List what could go, then
   **Checkpoint:** the owner chooses. AI adds and rarely removes.
2. **AI tells.** Go through [tells.md](tells.md) on the live screen. For each tell you find, try
   the alternative and let the owner compare before and after. It's a review list, not a ban
   list: banning up front makes the model invent stranger patterns.
3. **Copy by hand.** Treat AI-written copy as lorem ipsum. List every string on the screen in a
   table (where it is, current text). **Checkpoint:** the owner rewrites them in one voice. If
   they want a draft, offer the shortest plain version, and they still edit it.
4. Optionally run the critic once more to make sure nothing got worse.

## Wrap-up

In the product's `journal.md`: the directions, which came from seeds, the pick and why, the
intended aesthetic, critic scores per round, what was removed, which tells changed, and that the
copy is the owner's. Then promote the winner as in `/prototype` (keep it, delete the surface).
