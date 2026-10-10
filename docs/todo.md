# To do

Everything in flight, sprint and job hunt, in priority order. *(me)* = only I can do it.
Details are in the notes at the bottom. Ask Claude "where are we?" for an update.

## Now

**Scribble (product 03)**
- [x] Live at scribble-notebook.vercel.app
- [x] Live check on the phone: saved ✓
- [ ] Real Claude feedback
- [ ] Testing: audit, break-ui, simulated user
- [ ] Wrap-up and ship

**Job hunt**
- [ ] Book the Montu UK interview *(me)*
- [ ] Prepare for the charity interview *(me)*
- [ ] Keep applying for roles *(me)*

## Next (before product 04)

- [ ] `pnpm ship`: deploy setup in one command (#8)
- [ ] One place to stay on track (#10)
- [ ] Look at what Montu UK offers patients today (15 min)

## Later

- [ ] Scribble as a Mac app in Swift (#9)
- [ ] Show a product to one real person (#5)
- [ ] Rewrite the interview stories in my own words (#6)
- [ ] Fill the story bank's gaps: Ambiguity, Technical, Speed (#7)
- [ ] Learn evals: Scribble's model eval (#1)
- [ ] Maybe: Playwright smoke test (#3), Anthropic's `webapp-testing` skill (#4)

## Done

- [x] Judge the design skills: kept (#2, 7 Oct)

## Notes

- **#1 Evals:** first candidate is Scribble's feedback (in its backlog): ~8 sample pieces, a
  pass/fail checklist, Haiku vs Sonnet vs Opus.
- **#3 Playwright:** turn the user test's passing main flow into a test that runs on every change.
  The gap today: nothing checks a change didn't break yesterday's main flow.
- **#4 webapp-testing:** only if `user-tester` leaves gaps; it mostly overlaps.
- **#5 Real person:** no skill replaces this. On day 1 the biggest finds came from a real phone.
- **#6 Stories:** interviewers can hear a borrowed story; practise the 30-second version out loud.
- **#8 `pnpm ship`:** `vercel login` once; then one command I run myself (keys never pass through
  Claude) creates the project with the right name and Root Directory, copies env vars from
  `.env.local`, deploys and writes the URL into the card. A `vercel.json` replaces the "skip
  deployments" toggle. Saves ~10–15 min a day.
- **#9 Scribble for Mac:** learn SwiftUI on an app I use daily, same Supabase data as the web app.
  Decide: own public repo or inside `build-sprint`. For recruiters: README, short demo video,
  download in GitHub Releases. Opening without a warning needs Apple notarization ($99/year).
- **#10 One place:** also in Problems to solve; could be a sprint product.
- **Testing today:** `user-tester` (simulated user), `break-ui` and `web-design-guidelines`
  (edge cases and audits). Gaps: regression tests (#3) and real users (#5).
