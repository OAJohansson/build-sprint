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

- Pick an idea from [`ideas.md`](ideas.md), then `pnpm new <slug> "Display Title"`. This creates
  the app, the card, the product folder (with an empty brief) and the README row.
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
- **Requirements, no-gos and rabbit holes.** What the MVP must do, each as a user-visible
  behaviour with a check ("when location is blocked, search appears"), not a design. Then what
  it won't do (no-gos), and the traps that could eat the day (rabbit holes). This is what design
  and the prototype work from. *(Singer: the pitch; Cagan: requirements come out of discovery,
  not before it.)*
- **Test plan.** `user-testing/plan.md` from the [template](user-testing/): one scenario per top
  job, with success bars taken from the brief.
- **Three approaches.** Run `/prototype` on the main screen, pointing it at the brief, to get three
  genuinely different directions as working variants behind a picker. Judge them against the
  success signals, not just looks. Pick one or a mix, and note why in `journal.md`. *(Cagan:
  prototypes over documents.)*
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

## 3. Ship (≈15 min, do it early, e.g. at lunch)

First deploy of a new app (one-time, about 2 minutes):

1. [vercel.com/new](https://vercel.com/new) → import the `build-sprint` repo.
2. **Project name**: the slug without the number (e.g. `crossfit`), which gives `crossfit-<something>.vercel.app`.
3. **Root Directory** → `apps/NN-slug`. Framework auto-detects as Next.js.
4. Deploy.
5. Settings → Build & Deployment → Root Directory: enable **"Skip deployments when there are no
   changes to the root directory or its dependencies"**, so other days' pushes don't rebuild it.
   (Don't enable this on `portfolio`, which must rebuild whenever `docs/` changes.)
6. Paste the URL into the write-up's `url:` field → `pnpm sync` → commit.

Deploying in the morning means the rest of the day is iterating on a live app, which removes most of the last-minute risk.

## 3b. Test as a user (≈30 min, once the core flow works)

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
- **At most 3 process changes**, made *before* the next product starts: edit this playbook, the
  templates or the checklists, and log each one in [`learnings.md`](learnings.md) (the process changelog).
- Add 1–3 bullets under **Learned** on the card, and 3–7 **key learnings** under the product's
  heading in [`learnings.md`](learnings.md) (new design principles go there too).
- Set `status: shipped` (or `parked`, which is fine too) → `pnpm sync && pnpm notebook` → republish the notebook.
- Add a screenshot to `apps/portfolio/public/shots/NN-slug.png` (optional, makes the portfolio better).

## Definition of done

- [ ] Live URL works on phone and desktop
- [ ] Brief written before code, with its success check filled in at the end
- [ ] Write-up has user, problem, bet, url, learned and `status: shipped`
- [ ] README table and notebook are up to date
- [ ] A simulated user test has run, and its top findings are fixed or logged
- [ ] Retro written, and its process changes made before the next product starts
