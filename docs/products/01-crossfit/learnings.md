# Learnings

What building CrossFit Log taught me.

## Retro (7 Oct)

*Draft by Claude; edit to make it yours.*

**Numbers**

| | |
| --- | --- |
| Planned | 1 day |
| Actual | 2 days (6–7 Oct) |
| First live version | Day 1 (v1, before the needs brainstorm) |
| Pull requests | 7 |
| Feedback items | 18: 8 from my review, 10 from the simulated user test. 11 fixed, 7 parked |
| Who found the bugs | Me on a real phone: dictation repeating (twice), PB not saving, app not loading. Test agent: 4 wrong-number bugs (rep-max PBs, percentage base, "510" → 8:30, session count). My review: copy and UX |
| Time lost to setup | About half of day 2 (Supabase key type, dictation on Android) |

**Keep**
- Needs brainstorm, then 3 different design approaches, then a clickable prototype. Fast and decisive.
- Logging feedback first and fixing in batches, with only blockers fixed straight away.
- Simulated user test with a specific persona. It found the wrong-number bugs I didn't.

**Change**
- I built v1 before framing the moment of use, so v1 solved the wrong problem.
- Setup issues surfaced late and one at a time. Check every setting and the real phone on day one.
- "One day" became two. Decide what ships today, and what goes straight to the backlog, at kick-off.

**Try next time**
- Write the persona and test plan at kick-off; they double as the spec.
- Run the test agent before my own review, then review both together.

**What surprised me**
- Product: the most valuable feature (seeing progress) wasn't in my first brain dump at all.
- Technical: phones and desktops behave differently for dictation; config can "half work".
- Process: an agent playing a user found data bugs that a feature-by-feature review missed.

**Process changes carried forward** (logged in `docs/learnings.md`)
1. Kick-off: moment of use + top 3 jobs + 3 approaches + a stop line, before code.
2. Setup checklist on day one: real phone, every env var and key type, server logs with friendly
   user errors.
3. Persona and test plan at kick-off; test agent before own review.

## Product
- Frame the moment of use before building. The first MVP logged workouts well, but the real job
  was recalling a PB mid-class. A needs brainstorm turned that around in an hour.
- Showing three different design approaches side by side made the choice quick and confident, and
  the mix (A's board + B's review) was better than any single option.
- An app that only stores data feels like homework. Give something back: percentages, a PB
  celebration, and (next) visible progress.

## Engineering
- Test browser dictation on a real phone on day one. Chrome on Android re-sends earlier speech
  results, which desktop testing never showed.
- Check configuration up front (here, which kind of Supabase key is set), so a wrong setting fails
  loudly at load instead of half-working.
- Keep error messages for users general and put the technical reason in the server logs.
- A retry button needs visible feedback. When the retry fails instantly, it looks broken.

## Process and tools
- A Claude subscription can't power a deployed app; an API key can. Protect a public AI feature
  with an access code and a spend cap.
- Vercel in a monorepo: give the Vercel GitHub app access to the repo, set the Root Directory, and
  redeploy after changing environment variables.
- Run a simulated user test before real users. It catches the obvious problems cheaply.
