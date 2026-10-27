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

## Retro: Ears and Mentor (Founder mode, 23–24 Oct)

Full account: [`founder-run-report.md`](founder-run-report.md).

**Numbers:** no fixed appetite (overnight allowed); took about 27 hours of wall-clock time for three
slices: Ears v1 (PR 77), v1.1 (PR 78), Mentor (PR 79, after one rejected review). 97 learning and
39 toil decisions logged, 0 toil vetoes. 9 user tests, 6 data-evals runs, 20 critic runs. About
$6–7 of Claude usage, almost all Mentor testing. Bugs: agents caught most correctness bugs (preview
tracks, CORS, a 2:3 BPM error, half-time BPM sent to the Studio, profile wipes, wrong links, a
false key-fit claim); the owner caught the scope and design calls (snippets not the intro, queue
in the MVP, "too much going on", one chat, the help list).

**Keep**
- Spikes before the build: capture and model risks were answered on day one.
- Graders who never build: they caught real bugs every round, and the honesty checks held.
- Logging every call with a reason: the decision log made the review and this retro possible.

**Change**
- The owner sees screenshots early (a 2-minute check after the first prototype round), not only at the PR.
- Remove before adding: a critic gap is fixed by taking something away first.
- One critic with a fixed rubric per slice, and visual references instead of feel words.

**Try**
- Smaller slices (one screen or job per PR), a fresh PM session per phase, pre-approved routine ops (migrations, env keys) in the kickoff pack, a sandbox for graders.

**Surprised me:** how far apart "every check passes" and "the owner likes it" can be; that a fresh
critic each round made scores bounce instead of converge; that forcing a web search made genre
calls worse, because the web speaks the artists' scene words, not the owner's.

**For each goal**
- **A (product):** an analyser and a mentor only feel useful when they answer in the owner's words; the taste profile and My genre carry that, not the model.
- **B (product craft):** Founder mode needs an early owner look at pictures; a single late review is too late for layout.
- **C (technical):** tab capture of a cross-origin iframe, ONNX in a worker, prompt caching with a running memory summary, and validators that enforce honesty (sources, no invented links or numbers).

**Decision log read:** the owner would have chosen differently on the Mentor's information
architecture (L47's buttons-per-job panel became one chat, L86–L87) and on showing cost in the
panel (moved to Settings). The learning decisions that mattered most: L26 (snippets), L27 (queue),
L55 (no built-in taste data), L85–L88 (the simplification and memory). Defaults that held: the
storage, backend and honesty calls (L18, L49, L51, L60, L64).

## Retro: the Lab (Phase 4, Founder v2, 26–27 Oct)

Full account: [`eval-report-phase4.md`](eval-report-phase4.md).

**Numbers:** about two days (26–27 Oct), one PR (95), merged on the owner's yes. 71 learning and 35
toil decisions logged (L143–L213, T81–T115), 0 toil vetoes. A spike first (tab capture and live
separation), two design rounds of ~10 directions, ~14 critic passes, 5 slices, ~10 user tests, 2
data-evals runs; 431 unit tests. Usage: about 94 % of that week's Claude plan, extra usage off, so
no cost beyond the plan; Mentor and Stable Audio calls were pennies. Bugs: graders found the big
ones (Undo never saved since 19 Oct, block drags landing 20+ bars off, kick bleed pushing Suggest
to extremes); the owner found what needs ears ("Mine is way thinner", "no boom boom boom"), a
50 s wait with no countdown, and no way back from a sound drawer.

**Keep**
- Spike the riskiest technical bet first: tab capture plus in-browser separation was proven live
  before any design.
- The canvas sign-off: the owner commented on the final screens before the build, which caught
  taste calls the picks and the critic missed (now permanent, decision 0028 amended 27 Oct).
- When the owner's ear and the numbers disagree, build a measurement of the gap (the closeness
  score) and a blind test for the ear, instead of guessing at fixes.

**Change**
- Agents can't hear: plan an owner listening check early in any audio slice, not only at the
  final review. "Too thin" came after the eval report was written.
- Explain music and production calls in plain words with one picture-like analogy; three
  rewrites of the kick-and-bass explanation were needed (owner: "I'm like 10 years old").
- Vercel's 100-deploys-a-day limit blocked the preview: review on a local production build and
  keep previews for the final review only.
