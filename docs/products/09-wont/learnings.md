# Learnings

What building this product taught me.

## Retro

**Numbers:**
- **Time:** planned one day; took 24–25 Oct, roughly a day and a half of session time. The
  overrun was all design: three contact sheets, a wonton style sheet, an icon sheet, a mark sheet,
  a face comparison and a header comparison before the build.
- **PRs:** #80 (the product, one merge) and #84 (live URL); the wrap-up is the third.
- **Bugs and who found them:**
  - User tester: invisible save button, a slip message naming days that weren't slips (F2), no
    comeback message after a longer absence (N1), double tap adding a habit twice (N8).
  - Audit (break-ui and guidelines): anchors rewritten into nonsense ("I the alarm goes off"),
    "Your 0 clean days still count", user text re-cased, muted text under 4.5:1.
  - Owner: the dark header band, which the critic had flagged twice and the PM kept.
  - Unit tests: none caught a bug on their own.
- **Did the unit-test pick point at the right logic?** Yes and no. The day boundary, the clock
  change and month end were right first time and stayed right. But both real logic bugs (F2, N1)
  were in comeback detection, the third pick, and the tests encoded the wrong rule: they checked
  "one message per run", not "a message whenever you come back". The pick was right; the cases
  came from the spec instead of from a user coming back after a week away.

**Decision log, read at the retro** (L1–L26, T1–T21):
- **Where the owner overruled the PM:**
  - L4 stop habits in the MVP (PM had said build habits only)
  - L25 the icon stays on ink (PM had recommended plum)
  - L8 and the 0028 amendment: both design picks are the owner's
  
  All three were right, and the stop habit is the half of Wont the owner needed most.
- **PM decisions that turned out wrong:**
  - L14, the comeback message once per run. It looked tidy in the spec and failed the "lost week"
    case; L26 replaced it.
  - T11 and L19, keeping the dark header band. That was a taste call presented as a fix.
- **Toil vetoed:** none.
- **For the owner to add:** which defaults would you have made differently?

**Keep**
- Deep research before the kickoff: five researchers and a report writer gave the product its
  core idea ("design the comeback, not the streak") and a list of principles (P1–P18) that
  settled arguments later, including with the critic.
- The owner making both design picks. Every call that mattered was taste: wontons, the mark,
  adult-but-cute, the harsh header.
- The engineer building the data layer and day logic while the icon was still being designed.
- Graders who never built the thing: the tester's "resume without a reload" run found F2.

**Change**
- The design critic: five rounds at 6/10, because it never saw the requirements it kept asking to
  remove. Give it the pack's non-negotiables, or score only what's negotiable (0028's fixed
  scorecard does part of this).
- Taking a critic note seriously when it isn't about a requirement. The dark band was flagged
  twice; the PM filed it with the clashing notes and the owner caught it.
- The first Vercel deploy of a new project went to Production before the review. Pass
  `--target preview`, or create the project with `pnpm ship`.

**Try next time**
- For a product whose core moment is coming back, write the unit tests from the user's story
  ("away a week, opened once in the middle") rather than from the spec's rule.
- Settle the mark (icon and character) before the board, when a character carries the brand.

**What surprised me**
- A grown-up audience changed the whole design: "too childish" sent the wonton from kawaii to an
  icon, and the icon then decided the board.
- The wink: the owner turned the comeback, the product's core idea, into the mascot's
  expression. The best brand idea came from the owner, not the squad.
- How little of the effort was code: most of it was deciding what to show.

**Growth:**
- **A (product):** a habit app built around the moment after a slip, which no app in the
  landscape handles well.
- **B (product craft):** turning evidence into product calls (COM-B, if-then plans, the
  what-the-hell effect), and brand thinking: distinctive assets, only-ness, a mark at 29 px.
- **C (technical):** day logic with a 04:00 boundary across a clock change, and app lifecycle bugs
  that only appear when a tab is resumed without a reload.

**Process changes carried forward** (logged in `docs/learnings.md`)
1. Both design picks are the owner's in every mode (decision 0028 as amended 25 Oct).
2. Critic briefs include the pack's non-negotiables.
3. A project's first deploy is always a preview (`--target preview`) until the owner's merge.
