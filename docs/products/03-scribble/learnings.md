# Learnings

What building this product taught me.

*Retro drafted by Claude from the journal and feedback log, 10 Oct; the owner's own words to be added.*

## Retro

**Numbers:**
- **Time:** planned one day; took three (8–10 Oct). Discovery ~1 h as planned; design took four
  prototype rounds instead of one; build, deploy and testing about a day.
- **PRs:** 4 (#23 discovery and app, #24 the reader, #25 footer fix, #26 testing round).
- **Findings: 30 logged.** Owner: 10 (5 on the prototypes, 5 from the phone). Audit: 3. break-ui: 7.
  Simulated user: 10 (two major). 21 fixed, 3 won't-do, 1 kept on purpose for a week, 2 open, 3
  handled by owner decisions.
- **Guardrails measured:** first word in ~20 s first time, 6–8 s after (target ≤ 60 s); red ink
  2.9:1 → ~4.9:1 after the fix (target 4.5:1); first real reply passed the feedback checklist.

**Keep**
- Discovery before code: the WhatsApp insight (a topic comes to you, someone replies) and naming
  perfectionism as the riskiest assumption shaped every later decision: feedback on request, one
  lesson per piece, no pop-up, a forgiving weekly goal.
- Asking for a critique before changes (feedback #9): it turned "a pop-up before writing" into the
  "last time" line, which fits the riskiest assumption instead of fighting it.
- The testing order (audit and break-ui first, then the simulated user): the user test found new
  things instead of re-finding known ones.

**Change**
- Four prototype rounds. Three of them drew a literal typewriter when the owner wanted its
  feeling, the "evoked, not literal" distinction taught on day one of this product and then not
  applied. The first prompt to `/prototype` should state evoked vs literal and show real references.
- A behaviour from the prototypes (writing forward-only) slipped into the build without the owner
  ever choosing it. It surfaced only in break-ui.
- Daily setup (Vercel project name, domain, env vars) still took real time: to-do #8.

**Try next time**
- Before prototyping, collect 2–3 real references (apps, book covers, photos) for the feel, and
  name what *not* to do ("no illustrated machine").
- When promoting a prototype, list the behaviours it brings along as decisions for the owner.

**What surprised me**
- Product: the most valuable learning feature cost almost nothing: the reader's last lesson carried
  into the next page as one quiet line.
- Design: "make it feel like a typewriter" was best answered with no typewriter at all, through type,
  ink, rhythm and manuscript habits.
- Technical: my first speed measurement said 1 second per keystroke; it was the background browser
  tab slowing its frames, not the app (really 8–29 ms). Measure the thing, not the tab.

**Growth:**
- **A, product:** a product for my own daily habit, where the riskiest assumption was emotional
  (perfectionism), not technical, and the design had to serve it.
- **B, product craft:** critique before change; deliberate practice and feed-forward as product
  principles; deciding fast on two-way doors (light vs dark → follow the phone).
- **C, technical:** a real database with two-layer autosave (device first, server after a pause, save
  on page hide), structured output from Claude, grapheme-safe text, and the blast radius of a
  shared database key.

**Process changes carried forward** (max 3, logged in `docs/learnings.md`)
1. `/prototype` brief includes the feel's references and "evoked, not literal" (no drawing the object).
2. Promoting a prototype lists the behaviours it carries in as owner decisions.
3. Deploy setup becomes one command, `pnpm ship` (to-do #8), before product 04.
