# Test plan: Magpie

Bars are copied from [`../evals.md`](../evals.md) ("User test"), not made up here. Persona:
[`persona.md`](persona.md). One scenario per job (S1 capture, S2 recall, S3 relive/filter) plus S4
for the share safety net. The requirement checks R1–R12 in `evals.md` are run by the same tester in
a separate pass.

## How to run the app for testing

- Start: `pnpm -F 10-magpie dev --port 3110` from the repo root (keys come from
  `apps/10-magpie/.env.local`). The real Supabase database and the real sticker model are used.
- Browser: Playwright (`playwright-core` in `apps/10-magpie/node_modules`), Chromium at
  `/Users/ante/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`.
  Phone viewport 390 × 844 (deviceScaleFactor 2); laptop 1280 × 800 for R11.
  Launch with `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream` and grant the
  `camera` permission so the live viewfinder runs on a fake camera; the shutter then takes a
  (green test pattern) frame. For a real photo, use the photo-library button: its hidden
  `input[type=file]:not([capture])` takes a file (`apps/10-magpie/evals/photos/*.jpg`).
- **Access code: the graders' sandbox only** (decision 0028 #10). Read it from
  `apps/10-magpie/.env.local`, key `SANDBOX_ACCESS_CODE`; never print it. Never use `ACCESS_CODE`
  (the owner's book). The sandbox is a separate library: anything saved there never reaches the
  owner's shelves.
- Seed states (sandbox only), from `apps/10-magpie`:
  - **Fresh library** (R12, first run): `node --env-file=.env.local evals/seed.mjs --empty`, then
    a new browser context (no cookie, no localStorage).
  - **Returning user** (12 yums, London-heavy, a Taipei trip, wines and cocktails with 5 hearts):
    `node --env-file=.env.local evals/seed.mjs --clear`. Stickers take ~10–20 s each to appear.
- Simulated parts: the camera (fake device or a file), location (Playwright can grant
  `geolocation` and set coordinates, e.g. London 51.507, -0.128; without it the city falls back to
  the last one typed), and **the Android share sheet** (R5, S4): Chromium can't open a share
  sheet, so simulate the share target's POST: register the service worker by loading `/`, then
  from the page run
  `fetch('/share-target', { method: 'POST', body: formWithFiles })` with a `files` field holding an
  eval photo and follow the redirect (`/new?shared=1`), or post a real multipart form to
  `/share-target` via a form submit so the service worker handles it. Say which you did.

## Scenarios

### S1 · Capture a drink at the table (job 3, the riskiest assumption)
- **Moment:** a bar in London, a mezcal cocktail just arrived, friends talking. Returning user.
- **Task:** "Save this before I forget: Smoked paloma, a cocktail, at Kol, four hearts."
- **Success:** saved and on the Latest shelf in **≤ 30 s / ≤ 10 taps** (typing a field counts as one
  tap), without help. The saved screen shows the sticker (or the photo standing in) and its chips.

### S2 · Find "that wine" (job 1)
- **Moment:** in a wine shop, standing at the shelf, "what was the red I loved at Noble Rot?"
- **Task:** find it by the restaurant name or by its name and open it.
- **Success:** item page open in **≤ 10 s / ≤ 3 taps**, name readable at a glance.

### S3 · Show wines I loved (4+) in London (job 2)
- **Moment:** on the sofa, a friend asks for a wine bar tip.
- **Task:** show only the wines with four hearts or more, in London.
- **Success:** correct results in **≤ 15 s / ≤ 5 taps**; removing a chip widens the results again.

### S4 · Add a yum from a shared photo (job 3, the safety net)
- **Moment:** the next morning, scrolling the camera roll, a photo of last night's dessert.
- **Task:** share it into Magpie, name it "Tiramisu", dessert, 4 hearts, save.
- **Success:** saved with that photo in **≤ 40 s / ≤ 10 taps**.

## Value questions (ask in character after the scenarios)
- Would I open this when I'm *not* trying to find something? What would make me?
- Did anything feel like a chore at the table? What would I skip?
- Does Maggie add to it or get in the way?

## Scope
In: everything on the final-flow screens A–L. Out: owner-only checks; real Android share sheet;
real GPS.
