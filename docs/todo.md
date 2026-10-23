# To do

Everything in flight, sprint and job hunt, in priority order. *(me)* = only I can do it.
Details are in the notes at the bottom. Ask Claude "where are we?" for an update.

## Now

**Job hunt:** see [Focus](https://claude.ai/artifact/EBNLSbWYvYyf7moz26PCuV#focus) for interviews, deadlines and what's next. Job Coach keeps it current each morning.

## Next

- [ ] Selvedge: the AI features. First the style read over a board (palette, silhouettes, pieces, style names, brands with search links), tested against the brief's answer key; then the hand-drawn character (decision 0022, proposed)
- [ ] Selvedge: put it in the Mac Dock (Chrome: the install icon in the address bar; Safari: File → Add to Dock) *(me)*
- [ ] Before product 9: finish the operating modes (decision 0026), deferred until Selvedge shipped: the PLAYBOOK and AGENTS.md updates, `pnpm new` wiring, the ship and deploy rule changes; product 9 runs in Founder mode
- [ ] Six AM: in the main folder, switch to `main`, pull, copy `.env.local` into `apps/07-six-am/`, then `pnpm ship 07-six-am` *(me)*
- [ ] Six AM: the skipped checks on the live URL (`break-ui`, guidelines, simulated user test, a second device); see its backlog
- [ ] Merge the Inkling pull request in kids-app so the new app and `/demo` go live at inkling-journal.vercel.app *(me)*
- [ ] Rehearse the Inkling demo script (`docs/product/polish-sprint/demo-script.md` in kids-app) before the Enthuse interview *(me)*
- [ ] Scribble check on 17 Oct: pieces written that week (goal 4) and any abandoned *(me)*
- [ ] One place to stay on track (#10)
- [ ] Mallow follow-up: my own 5-minute phone review at mallow-omega.vercel.app, then one real patient (or someone with chronic pain) for a week; log in its feedback *(me)*

## Later

- [ ] Scribble as a Mac app in Swift (#9)
- [ ] Show a product to one real person (#5)
- [ ] Rewrite the interview stories in my own words, now including Scribble and Inkling (#6)
- [ ] Inkling: five conversations with 16–25-year-olds to test the riskiest assumption (want to *learn*, not only feel better)
- [ ] Learn evals: Scribble's model eval (#1)
- [ ] Maybe: Playwright smoke test (#3), Anthropic's `webapp-testing` skill (#4)

## Done

- [x] Folio shipped as product 06 (wrap-up on main)
- [x] Six AM shipped as product 07: timeline, 48 synthesised loops, saving to Supabase (19 Oct)
- [x] Mallow shipped: mallow-omega.vercel.app (12 Oct)

- [x] Inkling shipped as product 05: polish sprint, Claude API, evals 8/8 (12 Oct)
- [x] Story bank gaps filled by Inkling's story: Ambiguity, Technical, Speed (#7, 12 Oct)
- [x] `pnpm ship`: deploy setup in one command (#8, 12 Oct)
- [x] Scribble shipped: scribble-notebook.vercel.app (10 Oct)
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
