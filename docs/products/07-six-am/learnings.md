# Learnings

What building this product taught me.

- **Use the owner's mental model.** My jam grid of lanes made no sense to the owner, who
  expected GarageBand's timeline (Jakob's law). It failed the brief's usability risk before any
  code: the cheapest moment to be wrong.
- **Content before layout.** The first contact sheet looked "childish" partly because nobody had
  agreed what the screen must hold. Listing features from GarageBand and rekordbox first made the
  second sheet land.
- **Pictures beat words for choosing.** The owner couldn't choose from ten one-liners and asked
  to blend them all; a contact sheet of thumbnails let them pick in one go without averaging the
  ideas into mush.
- **Seeing both changes minds.** The owner liked solid colour blocks and the critic didn't; side
  by side, the owner chose the critic's version and kept only the turntable.
- **Hear it today.** Synthesised loops (decision 0019) gave real, in-key sound on day one instead
  of a day of sample curation, and forced the audio-clock timing to be right early.
- **When you can't hear, measure.** A temporary level meter checked every loop makes sound and
  sits at a sane level; it caught near-silent disco strings. Whether it sounds like house stays
  the owner's ear test.
- **A hidden feature isn't a feature.** Delete already worked, but nothing said so; the bin that
  appears while you hold a loop is the signifier (Don Norman).

## Retro

**Numbers:** planned one day; took two (18–19 Oct), including a parked first idea, two contact
sheets, three prototypes, two critic rounds, sound, saving and 24 extra loops. One PR at ship.
Bugs: the owner found one (an error from a stale sound engine after a hot reload); I found five
in my own checks (missing sleeve art, broken block colours, a stale-closure undo risk, a save on
every load, near-silent strings); the critic found the design gaps. Unit tests: 21, for snapping,
overlap, scheduling, "5 min ago" and crate–recipe agreement; none caught a bug yet, but the
recipe test guards the 48-loop list. The pick pointed at the right logic.

**Keep**
- Discovery before code, even when the idea changes mid-way (self-discovery parked, music chosen).
- The design session's critic and the owner's overrule: both mattered.
- Synthesis first, so the riskiest assumption could be heard on day one.

**Change**
- Agree the screen's features before any design directions (process change 1).
- Check `main` before holding back shared pages for a parallel product; Folio had shipped hours
  earlier and the carry-over waited needlessly (process change 2).
- Ship earlier. The playbook says deploy the empty starter in the first hour; with a parallel
  product it waited until the end, and the checks were skipped to get it out.

**Try next time**
- A contact sheet of thumbnails whenever the owner can't choose from words (process change 3).
- Run `break-ui` and the user test before adding features, not after.

**What surprised me**
- The owner overruled their own earlier taste once they saw two versions side by side.
- How far synthesis goes: 48 loops, all in key, with no files at all.
- That the dev server's hot reload could keep an old sound engine alive and crash it.

**Growth:**
- **A (product):** a pivot mid-discovery is cheap; the parked idea is saved, not lost.
- **B (product craft):** content before layout, Jakob's law and signifiers, met in practice.
- **C (technical):** Web Audio scheduling on the audio clock, synthesis with Tone.js, Supabase
  autosave behind an access code.

**Process changes carried forward** (logged in `docs/learnings.md`)
1. Playbook step 1: before `/design-session`, list what the screen must hold, from 1–2 real apps
   the owner knows.
2. Playbook step 1: a product started in parallel gets a worktree from the latest `main` and a
   carry-over list; check `main` before holding back shared pages.
3. Playbook step 1: if the owner can't choose from one-liners, show a contact sheet of rough
   thumbnails of all directions, then build three.

## Mentor (Founder mode), 24 Oct

- **The squad's design ignored our own principles.** The owner found the Mentor panel "too much
  going on": tabs, job links, a slash menu, footnote markers, a cost line, a long taste text. Clean
  and minimal (decision 0007) and Emil's restraint were in the rules, but nothing in the flow
  enforced them, and the critic scored 6–7 round after round without the designs getting simpler,
  because each fix added a control instead of removing one. For the Founder-mode retro: which
  skills each agent actually used (design-session, emil-design-eng, web-design-guidelines,
  break-ui), why critic scores didn't drive subtraction, and whether to add design skills or a
  "remove first" rule to the designer and critic.
