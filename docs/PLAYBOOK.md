# Daily playbook

One product per day. Done beats perfect. Scope is the main lever, so cut early.

## 1. Pick and frame (≈45 min, before any code)

- Pick an idea from [`ideas.md`](ideas.md).
- `pnpm new <slug> "Display Title"`. This creates the app, the card, the product folder and the README row.
- **Moment of use and top 3 jobs.** When, where and in what state does the person open this? What
  are they trying to get done ("when…, I want…, so I can…")? *(Day 1: v1 skipped this and solved
  the wrong problem.)*
- **Persona and test plan.** Fill in `docs/products/NN-slug/user-testing/persona.md` and `plan.md`
  from the [templates](user-testing/). They double as the spec.
- **Three approaches.** Sketch three genuinely different solutions, then run `/prototype` on the
  main screen to get them as working variants behind a picker. Pick one or a mix, and note why in
  `journal.md`.
- **Stop line.** Write in `journal.md` what ships today and what goes straight to `backlog.md`.
- Fill in **user**, **problem** and **bet** (one line each) on the card `docs/products/NN-slug.md`.
  The bet is the smallest thing that could solve the problem by tonight. Cut everything else.

## 1b. Setup checklist (≈15 min, first hour)

Day 1 lost half a day to setup surprising us late, one problem at a time. Check these once, early:

- [ ] Every environment variable set in Vercel (Production *and* Preview), with the right *kind*
  of key (secret vs publishable), and a redeploy after changing them.
- [ ] Opened on a **real phone**, not just desktop. Test any browser feature (mic, camera) there.
  The starter already has the phone baseline (`mobile-native` skill); use the skill when something
  "feels like a website" on the phone.
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

- Run the `user-tester` agent against the running app with the persona and plan from step 1; save
  its report as `user-testing/report-YYYY-MM-DD.md`.
- Run `break-ui` on the main screens (worst-case data: long names, zero, one, huge numbers) and
  the `web-design-guidelines` audit on the changed files.
- **Then** do your own review. Log both in `docs/products/NN-slug/feedback.md`, fix blockers
  straight away, and prioritise the rest together.
- Triage rule for leaving a product: fix anything that shows wrong numbers or looks broken if it's
  quick; park the rest in `backlog.md` with a "start here" note.
- Full method: [`user-testing/README.md`](user-testing/README.md).

## 4. Wrap up (≈30 min)

- **Retro** in `docs/products/NN-slug/learnings.md`: numbers (planned vs actual time, PRs, bugs and
  who found them), Keep / Change / Try, what surprised you.
- **At most 3 process changes**, made *before* the next product starts: edit this playbook, the
  templates or the checklists, and log each one in [`learnings.md`](learnings.md) (the process changelog).
- Add 1–3 bullets under **Learned** on the card, and 3–7 **key learnings** under the product's
  heading in [`learnings.md`](learnings.md) (new design principles go there too).
- Set `status: shipped` (or `parked`, which is fine too) → `pnpm sync && pnpm notebook` → republish the notebook.
- Add a screenshot to `apps/portfolio/public/shots/NN-slug.png` (optional, makes the portfolio better).

## Definition of done

- [ ] Live URL works on phone and desktop
- [ ] Write-up has user, problem, bet, url, learned and `status: shipped`
- [ ] README table and notebook are up to date
- [ ] A simulated user test has run, and its top findings are fixed or logged
- [ ] Retro written, and its process changes made before the next product starts
