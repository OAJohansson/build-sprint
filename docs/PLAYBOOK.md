# Daily playbook

One product per day. Done beats perfect. Scope is the main lever, so cut early.

## Why I'm doing this

By day 20 I want to be clearly better at three things. It's about learning by doing: early
products can be rough, as long as each one teaches something.

- **A. Building good products with AI:** products that delight users and impress recruiters.
- **B. Product craft:** working the way good product managers do.
- **C. Technical skill:** understanding what I build, not just shipping it.

The practices are grounded in people who are great at this craft; who said what, and why it
matters, is in [Product craft](product-craft.md). Claude is my product coach as well as my
builder: at each step it names the practice, makes me
take the product decisions, challenges solution-first thinking, and explains the technical
choices in plain words.

## 1. Discover and frame (≈60 min, before any code)

Fall in love with the problem, not the solution. Write it all in the product's **brief**
(`docs/products/NN-slug/brief.md`): a one-page PRD, one short section per step. Timebox it: an
hour, not a day. Names in brackets are where each practice comes from; see
[Product craft](product-craft.md).

- Pick a problem from [Problems to solve](ideas.md), then `pnpm new <slug> "Display Title"`. This creates
  the app, the card, the product folder (with an empty brief) and the README row.
- **Ship the empty starter straight away** (04 Mallow): merge the scaffold and run
  `pnpm ship NN-slug` in the first hour, so every later change is seen on a real phone.
- **Starting while another product wraps up** (07 Six AM): work in a worktree cut from the latest
  `main`, keep a "to carry over" list in the journal for shared pages, and check `main` before
  holding them back; the other product may already be merged.
- **Problem.** One or two sentences: who has it, when, and what it costs them today. No features.
  *(Perri: outcomes over outputs.)*
- **Who.** A quick persona: one specific person, not a market. Full version in
  `user-testing/persona.md` from the [template](user-testing/).
- **Moment of use and jobs to be done.** When, where and in what state do they open this? Their
  top 3 jobs as "When…, I want…, so I can…", ranked. *(Christensen and Moesta. Day 1: v1 skipped
  this and solved the wrong problem.)*
- **Today's alternatives.** How do they solve it now (an app, Google, a friend, nothing)? What's
  good about that, and what's annoying? Why would anyone switch? If you can't answer the last
  question, change the idea or find the edge before building. *(Moesta: the forces that make
  people switch.)*
- **Riskiest assumptions.** What must be true for this to work? Check the four risks: *value*
  (will they use it?), *usability* (can they?), *feasibility* (can I build it today?),
  *viability* (does it work for me: cost, data, time?). Mark the riskiest one; the MVP must test
  it. *(Cagan's four risks; Torres: test assumptions, not ideas.)*
- **Success: what good looks like.** Decided *before* building. One main outcome for the user
  (not a feature list), plus 2–3 signals and how I'll measure each: in the user test (task done,
  time, taps, "would you use it again?"), and live if it's worth it (e.g. Vercel Analytics). Add
  one guardrail (something that mustn't get worse, like correct numbers). Measure what a feature
  is *for*, not that it exists. *(Perri; Doshi: pre-mortem, "it failed, why?")*
- **MVP and stop line.** The smallest thing that does the top job and tests the riskiest
  assumption. The appetite is one day: fix the time, cut the scope. List what ships today;
  everything else goes straight to `backlog.md`. *(Singer, Shape Up: appetite.)*
  When the product carries a learning ladder (several models, levels or versions to try), set
  the MVP cut first: only the first rung that ships on its own is in scope, and the rest of the
  ladder starts in the backlog (06 Folio).
- **Requirements, no-gos and rabbit holes.** What the MVP must do, each as a user-visible
  behaviour with a check ("when location is blocked, search appears"), not a design. Then what
  it won't do (no-gos), and the traps that could eat the day (rabbit holes). This is what design
  and the prototype work from. *(Singer: the pitch; Cagan: requirements come out of discovery,
  not before it.)*
- **Test plan.** `user-testing/plan.md` from the [template](user-testing/): one scenario per top
  job, with success bars taken from the brief.
- **Unit-test pick (≈5 min).** Under **Unit tests** in the brief, name the 0–3 pieces of logic
  that would hurt most if they were silently wrong, and the edges to check for each (midnight,
  month end, empty history, a 0 or a huge number). Default to dates, times and streaks; "none" is
  a fine answer for an app without such logic. This is practice in judging risk, not a hunt for
  zero bugs: keep each test small, and at the retro note whether one caught anything.
  *(Risk-based testing: test where failure is likely and costly. Decision 0011.)*
- **Three approaches.** First agree what the screen must hold, listed from 1–2 real apps the
  owner already knows (content before layout; *day 7: a "childish" first sheet*). Then collect 2–3
  real references for the feel (apps, covers, photos) and write down what *not* to do. If the
  owner can't choose from one-line directions, show a contact sheet of rough thumbnails of every
  direction before building three. A feel is evoked, not drawn: no illustrating the object behind a
  theme. *(Day 3: four rounds of literal typewriters.)* Then run `/design-session` on the main screen
  (decision 0013): seeds and broad ideas, `/prototype` for three genuinely different directions
  behind a picker, a fresh-eyes critic that scores screenshots until 9/10, then subtract, check
  for AI tells and rewrite the copy by hand. Judge them against the success signals, not just looks. Pick
  one or a mix, and note why in `journal.md`. When the chosen variant becomes the real app, list
  the behaviours it brings along (e.g. "you can only edit at the end") as decisions for the owner.
  *(Cagan: prototypes over documents.)*
- Fill in **user**, **problem** and **bet** (one line each) on the card `docs/products/NN-slug.md`.
  The bet is the smallest thing that could solve the problem by tonight. Cut everything else.

## 1b. Setup checklist (≈15 min, first hour)

Day 1 lost half a day to setup surprising us late, one problem at a time. Check these once, early:

- [ ] Every environment variable set in Vercel (Production *and* Preview), with the right *kind*
  of key (secret vs publishable), and a redeploy after changing them.
- [ ] Opened on a **real phone**, not just desktop. Test any browser feature (mic, camera) there.
  The starter already has the phone baseline (`mobile-native` skill); use the skill when something
  "feels like a website" on the phone.
- [ ] **Cloud sandbox can reach what it needs** (Claude Code on the web): in the environment's
  network settings, allow `*.vercel.app` and every API the product calls (as `*.domain.com`), so
  Claude can check deploys and test with real data. For browser tests, run a production build
  (`pnpm -F NN-slug build && pnpm -F NN-slug start`) and open it by the machine's address: Next's
  dev server only serves its scripts to localhost. *(Day 2 lost about an hour to this.)*
- [ ] Server errors are logged with the real reason (`failure()` in `src/lib/server/failure.ts`),
  while users only see a general message. Buttons that retry show that they're working.

## Design principle: clean and minimal

Every element has to earn its place. If the visual already says it (three dots, one ticked), don't
repeat it in text. Cut labels, hints and subtitles that restate what's on screen; keep a feature
discoverable with one quiet cue (a muted badge at 0) rather than a sentence explaining it.

## 2. Build (bulk of the day)

- `pnpm install && pnpm -F NN-slug dev`
- Data lives in `localStorage` (`useLocalStorage` in `src/lib`) unless the product truly needs a backend.
- Add UI pieces with `pnpm dlx shadcn@latest add <component>` from inside the app folder.
- Polish with the `emil-design-eng` skill (press feedback, timing, when not to animate); `animate`
  only if a screen needs motion; `dataviz` for charts.
- Commit and push often. Pushes to `main` deploy automatically once the Vercel project exists.
- **Re-cut on every scope widening.** When a request adds anything past the stop line, name it
  before building: cut something, swap it for something, or re-bet the appetite out loud. Log the
  choice in `journal.md`. *(05 Inkling: "a few hours" quietly became the whole app.)*
- **Date, time and streak logic has unit tests.** Keep it in a plain function in `src/lib` with a
  `*.test.ts` beside it: a normal case plus the edges (midnight, month end, empty history), with
  "now" fixed by `vi.setSystemTime`. `pnpm -F NN-slug test`. *(04 Mallow: time bugs only showed
  when the tester let time pass; decision 0011.)*
- **AI behaviour has its own tests.** Before and after any change to a model, provider or prompt,
  run the product's evals and record the result. A new model is a behaviour change. *(05 Inkling:
  the evals caught two rules the new model broke.)*

## 3. Ship (≈5 min, do it early, e.g. at lunch)

First deploy of a new app, one command (to-do #8, from 03 Scribble's retro):

1. Merge the scaffold to `main` (Vercel builds from there).
2. Put the app's keys in `apps/NN-slug/.env.local` (copy from the previous app; `.env.example`
   lists what's needed). Git ignores this file.
3. Run **`pnpm ship NN-slug`** yourself (`--dry-run` first if you like). It creates the Vercel
   project named after the product with Root Directory `apps/NN-slug`, connects GitHub, sets the
   env vars for Production and Preview, deploys `main`, waits until it's live and writes the URL
   into the card. Keys go from the file straight to Vercel and are never printed.
4. Commit the card. Each app's `vercel.json` skips builds when its folder didn't change (not on
   `website`, if it reads `docs/` and must rebuild when they change).
   Apps deploy from `main` only: branch pushes make no deployments, because even cancelled ones
   count toward the free plan's 100 a day (decision 0016). Push and merge in batches.

One-time on a new machine: `vercel login`. To change a key later: edit `.env.local`, run
`pnpm ship NN-slug` again (it updates the project and redeploys).

Deploying in the morning means the rest of the day is iterating on a live app, which removes most of the last-minute risk.

## 3b. Test as a user (≈30 min, once the core flow works)

- **Walk the brief on a fresh install** (04 Mallow): clear the app's data and check every
  requirement in the brief, not on the demo. Demo data hides missing features.
- **First the checks:** run the `web-design-guidelines` audit on the changed files and `break-ui`
  on the main screens (worst-case data: long names, zero, one, huge numbers). Fix what they find.
  *(Day 2: the user test re-found a bug the audit had already caught.)*
- **Then the simulated user:** run the `user-tester` agent on the fixed build with the persona and
  plan from step 1; save its report as `user-testing/report-YYYY-MM-DD.md`. It measures every
  guardrail in the brief with a number.
- **Then** do your own review. Log both in `docs/products/NN-slug/feedback.md`, fix blockers
  straight away, and prioritise the rest together.
- Triage rule for leaving a product: fix anything that shows wrong numbers or looks broken if it's
  quick; park the rest in `backlog.md` with a "start here" note.
- Full method: [`user-testing/README.md`](user-testing/README.md).

## 4. Wrap up (≈30 min)

- **Success check** in the brief: for each success signal, what actually happened. Did it solve
  the problem? Honest is more useful than good.
- **Retro** in `docs/products/NN-slug/learnings.md`: numbers (planned vs actual time, PRs, bugs and
  who found them), Keep / Change / Try, what surprised you, and one thing learned for each goal
  (A product, B product craft, C technical).
- **Knowledge bank:** add any general concept learned during the product (not product-specific),
  with quiz questions, to [`knowledge-bank.md`](knowledge-bank.md). Do a few minutes of the
  notebook's Quiz at the start of each day.
- **Interview story** (≈10 min) in `docs/products/NN-slug/story.md`: the product as a STAR story
  you could tell in 2 minutes, with a headline, the interview themes it covers, the assumptions
  that turned out right or wrong, and likely follow-ups. Built from the brief, feedback and retro.
  The [story bank](interview-stories.md) shows which themes still need a story.
- **At most 3 process changes**, made *before* the next product starts: edit this playbook, the
  templates or the checklists, and log each one in [`learnings.md`](learnings.md) (the process changelog).
- Add 1–3 bullets under **Learned** on the card, and 3–7 **key learnings** under the product's
  heading in [`learnings.md`](learnings.md) (new design principles go there too).
- Set `status: shipped` (or `parked`, which is fine too) → `pnpm sync` → commit and merge → republish the notebook from `main` (`pnpm notebook`; see AGENTS.md).
- Take a screenshot of the product for the website (where it goes is decided in the website brief).

## Definition of done

- [ ] Live URL works on phone and desktop
- [ ] Brief written before code, with its success check filled in at the end
- [ ] Write-up has user, problem, bet, url, learned and `status: shipped`
- [ ] README table and notebook are up to date
- [ ] A simulated user test has run, and its top findings are fixed or logged
- [ ] Retro written, and its process changes made before the next product starts
- [ ] Interview story written
