# Learnings

What building this product taught me.

## Retro

**Numbers:**
- **Time:** 26 Oct afternoon and evening for discovery, naming and design (brainstorm, a research
  round, 10 directions, a mascot round, every key screen, a re-cut of the shelf); the build ran
  overnight in one Founder PM session; final review and wrap-up on 27 Oct. About a day, with the
  design taking the larger share of my time and the build almost none.
- **PRs:** #88 (kickoff, design docs, scaffold), #89 (the MVP and the `sharp` fix), and this
  wrap-up.
- **Bugs and who found them:**
  - Design-skill audit: 19 fixed (validation off-screen with the keyboard open, a filter sheet
    without focus trap, a 30 px toggle, long names overflowing).
  - Critic, three rounds (7 → 8 → 9): the saved moment needed Maggie as the hero; stickers looked
    glossy; the laptop page grew wider than the screen.
  - Sticker eval, three versions: the wrong item drawn on a busy photo, copied bowl prints, and a
    missing outer outline on a third of stickers, solved by drawing the edge in code.
  - User test: F1–F9 (wine hidden until Drinks was tapped, "red wine" found nothing, a yum with no
    city fell out of every place filter).
  - **Me, on the preview:** every request crashed on Vercel (`sharp` without its native library).
    No grader could reach the preview behind Vercel's login, so the crash reached the final review.
  - Unit tests (16): none caught a bug; the logic they cover was right first time.
- **Did the unit-test pick point at the right logic?** Partly. "New this month" and the home city
  were worth pinning, but the real bugs were in filtering (a yum with no city) and the deploy.

**Decision log, read at the retro:**
- **Where I changed course:** shelves by country (the first design) → kind first, because most
  yums happen at home in London; option 2 (my coach's pick) → option 3, smart shelves, for the
  overview and the recommendations it can grow into. Both were right for me.
- **PM decisions that mattered:** saving before the AI (L2), the edge drawn in code (L9), soft
  remove with Undo (L5).
- **Defaults to question:** reusing Selvedge's access code (T1) meant I didn't know my own code at
  the final review; a sticker drawn from the name when there's no photo (L3).
- **For me to add:** which other defaults would I have made differently?

**Keep**
- Agreeing the features and screens before any design, then designing in Claude Design with
  comments on the canvas.
- Showing only the brand moments in the second round (the shelf and the saved screen per
  direction) instead of every screen four times.
- Re-cutting the design when real life disagreed with it (London, not trips) before handing off.
- Graders who never built it: three sticker evals, three critic rounds and a user test overnight.

**Change**
- The final review was the first time anyone opened the deployed app. Open the preview (or
  script it) before the owner's push.
- Name the access code in the review message, or don't reuse a code the owner doesn't remember.

**Try next time**
- A one-line deploy check in the PM's definition of done: the main path on the deployed preview,
  with logs read, before the review push.
- Start from the user's real context earlier: "where will I use this most?" would have put London
  ahead of trips from the first design round.

**What surprised me**
- How much the mascot did: once Maggie had a job (she collects shiny things), the copy and the
  saved moment almost wrote themselves.
- The image model followed almost every rule except one, and no prompt fixed it; code did.
- I want to keep building this one: a community for foodies, starting with my cousin in Japan.

**Growth:**
- **A (product):** separating the problem from my first solution (two jobs, recall and relive)
  kept the scope honest, and real context (London, three weeks of travel a year) changed the main
  screen.
- **B (product craft):** a name is a promise plus a character; Maggie made the brand, and
  designing the peak moment (the saved screen) told me more than designing every screen.
- **C (technical):** native modules on Vercel need their shared libraries traced; work after the
  response (`after()`) keeps a slow AI step out of the user's way.

**Process changes carried forward** (max 3, logged in `docs/learnings.md`)
1. Founder design can be done by me with Claude in Claude Design before the PM session: features
   first, ~10 directions, a brand-moment round, the final flow; the PM builds from the canvas.
2. Before the final-review push, the PM opens the deployed preview's main path and reads its logs
   (my logged-in browser if a script can't reach it).
3. Link a folder to its Vercel project before any `vercel` command with `--yes` (it creates a
   project named after the folder).
