# Daily playbook

One product per day. Done beats perfect. Scope is the main lever, so cut early.

## 1. Pick and frame (≈30 min)

- Pick an idea from [`ideas.md`](ideas.md).
- `pnpm new <slug> "Display Title"`. This creates the app, the write-up and the README row.
- Fill in **user**, **problem** and **bet** (one line each) in `docs/products/NN-slug.md` *before writing code*.
  The bet is the smallest thing that could solve the problem by tonight. Cut everything else.

## 2. Build (bulk of the day)

- `pnpm install && pnpm -F NN-slug dev`
- Data lives in `localStorage` (`useLocalStorage` in `src/lib`) unless the product truly needs a backend.
- Add UI pieces with `pnpm dlx shadcn@latest add <component>` from inside the app folder.
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

- Write `docs/user-testing/NN-slug/persona.md` and `plan.md` from the templates (one specific person,
  scenarios as their real moments, each with a success bar).
- Run the `user-tester` agent against the running app. It writes `report-YYYY-MM-DD.md`.
- Add its findings to `docs/feedback/NN-slug.md` next to your own review, then prioritise together.
- Full method: [`user-testing/README.md`](user-testing/README.md).

## 4. Wrap up (≈20 min)

- Add 1–3 bullets under **Learned** in the write-up.
- Set `status: shipped` (or `parked`, which is fine too) → `pnpm sync && pnpm notebook` → republish the notebook.
- Add a screenshot to `apps/portfolio/public/shots/NN-slug.png` (optional, makes the portfolio better).
- Anything that applies beyond this product → one line in [`learnings.md`](learnings.md).

## Definition of done

- [ ] Live URL works on phone and desktop
- [ ] Write-up has user, problem, bet, url, learned and `status: shipped`
- [ ] README table and notebook are up to date
- [ ] A simulated user test has run, and its top findings are fixed or logged
