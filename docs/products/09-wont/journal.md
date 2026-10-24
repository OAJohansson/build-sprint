# Journey

What happened, what was decided and why. Newest last.

## To carry over

For the shared pages (knowledge bank, problems, learnings, process changes), written once at wrap-up (AGENTS.md).

- `docs/knowledge-bank.md` (customer insight / product strategy): the habit-science basics from
  `research.md`: if-then plans (Gollwitzer), automaticity takes ~2 months (Lally, Singh), the
  what-the-hell / abstinence-violation effect, reminders vs cues (Stawarz), why streaks backfire
  (Silverman & Barasch), "ask about past behaviour" (The Mom Test), job to be done (Christensen).
- `docs/knowledge-bank.md` (design and UX / product strategy): distinctive brand assets (Byron
  Sharp, *How Brands Grow*) and "only-ness" (Marty Neumeier, *Zag*); a character sheet / mark
  tested at 29 px before it becomes an illustration system.
- `docs/learnings.md` process changelog: running a deep-research step (5 parallel researchers and
  a report writer) before writing a Founder kickoff pack.

## 24 Oct: kickoff conversation

- **Parallel work.** The Six AM Founder session runs in its own worktree; Wont started in
  `.claude/worktrees/09-habits` on branch `09-habits`, cut from the latest `origin/main`. No
  shared app files; shared pages wait for wrap-up.
- **Deep research first.** The owner asked for evidence before features. Five researchers
  (frameworks, forming habits, breaking habits and lapses, digital interventions, app landscape)
  and one report writer: `research.md`, notes in `research/`. Headline: design the comeback,
  not the streak.
- **Problem before solution.** Asked which habits, then what happened last time (The Mom Test:
  past behaviour, not intentions). Owner's habits: wake and go to bed early, read 10 pages, write
  a journal entry or short story, stop nicotine pouches, stop self-doubt. Sleep has been a
  constant battle: without a morning commitment they sleep in and then feel bad. They are on day 5
  of 7am wake-ups and quit pouches on 23 Oct, so the app is needed now.
- **Self-doubt** is a thought pattern, not a behaviour; suppression rebounds. Left out of the MVP
  (backlog).
- **Owner's MVP sketch, tested against the research.** Kept: a written commitment to myself
  (shaped as an if-then plan), a SMART daily goal, one-tap tracking, a gentle message after a
  miss. Cut: notifications (morning motivation fades by ~week 4 and the phone becomes the cue;
  evening log reminder also dropped for the MVP, so no backend). The comeback message shows in
  the app the next time it opens instead of by email.
- **Intro animation kept as a learning goal** (the owner has never built animation). Scoped: about
  15–20 s, skippable, once at first launch, three messages from the research (about two months
  not 21 days; tie it to something you already do; missing a day doesn't reset you).
- **Stop habits in the MVP** (owner, against Claude's recommendation to start with build habits
  only): the owner quit pouches yesterday and needs it now. Mechanics from the research: clean days
  counted (not reset to zero), slips logged with size, urges logged with "ride it out".
- **Name: Wont** (an old word for habit, "as is my wont"), picked from a creative round; Loop
  is taken by Loop Habit Tracker.
- **Kickoff pack finished** (owner): one-day appetite; feel "a drawing board with big cards, not a
  checkbox list", with six app screenshots as references (cards and colour taken, streaks and
  trophies left out).
- **Design stays with the owner** (owner, for this and every future product): Founder mode had the
  PM pick the design. Changed so the owner shortlists 3 of 8–10 sketches on a contact sheet and
  picks 1 of the 3 built prototypes. Process change made at once in the playbook, `AGENTS.md`,
  decision 0026 and the designer agent (a session whose task is a process change edits shared
  pages directly).
- **Contact sheet, 10 directions** for the board (`design/contact-sheet.html`): 01 Ink zigzag, 02
  Pairs on a tray, 03 Rising tide, 04 Masonry wall (seeds); 05 Bold slabs, 06 Soft fill
  (references); 07 Drafting table, 08 Poster wall (far away); 09 Seed packets, 10 A hand of cards
  (sound wrong). Waiting for the owner's shortlist of three.
- **Contact sheet 1 rejected** (owner): "no brand consistency", hard to scan, Bold slabs gives a
  headache. Kept 09 Seed packets (cute) and 06 Soft fill (colour, simple layout) to iterate; the
  week calendar moves out of the cards into one strip at the top. Asked for 8 new directions:
  coherent, simple to scan, nice to look at. Feedback 1–6. Lesson: the first sheet optimised for
  difference; the owner judges coherence first.
- **Contact sheet 2** (owner): Terracotta is the favourite, kept as is. Soft fill's colour mix
  doesn't work (same-colour pairs, then green, then purple pairs): try even colours. Seed packets
  again as one card per line. Moon phases out. Asked for seven more new directions. Taste so far:
  one column, calm, one hue family, warm; not dark, not mixed pastels.
- **Shortlist** (owner, after sheet 3): changed their mind back to sheet 2's Jars, all cards one per
  line like its nicotine card. Three variants of that one layout: jars with marbles, wontons (a
  pun on the name), and the seed sprout. Built straight as the three prototypes to save a round.
- **Prototype critic round 1** (design-critic, screenshots only): Wontons 6/10, Jars 5/10, Seed
  sprout 4/10. Shared gaps: a kept card looks like an open one (only a text line changes); the big
  "6 of last 7" outshines the habit name; the pink comeback box reads as a soft failure state with
  coach-bot copy; the slip is the loudest colour on screen. Critic's calls that clash with the
  pack (owner decides): drop the rolling number (R6, P6) and the week strip (owner's request).
- **Pick: Wontons** (owner). Asked for wontons that look more like wontons, and prototypes of
  the other features. Define loop next on a copy beside the pick.
- **Critic round 2** (Wontons v2): 6/10, flat (v1 also 6). Its top asks clash with the pack:
  cut the anchor sentence (P1, the strongest evidence) and drop the steamer (owner's pick).
  Valid and in-pack: steamer too small to read progress; week dots all look the same; stop card
  "loses" colour after a slip; slip/urge links too small. Score not rising after two rounds, so
  stopped and shown to the owner (design-session rule).
- **Wonton style sheet** (owner): the wonton is the whole design, so a separate exercise of 10
  wonton styles (cute, cartoon/anime, playing with colour and shape). v1's wontons preferred over
  v2's "realistic" ones.
- **Wonton sheet 1 rejected** (owner): too childish; adults should want to use it, still cute.
  Reframed as an icon exercise: design the mark first, then use it for the wontons. Sheet 1 kept
  (`design/wonton-sheet.html`).
- **Mark shortlist** (owner): Calm face (loves it, worried it reads as Headspace), Riso, Enamel
  pin (colours). Brand pros/cons given in chat; designer exploring 4 differentiated Calm faces
  (one in riso), 2 Riso refinements, 4 enamel colourways (`design/mark-sheet.html`).
