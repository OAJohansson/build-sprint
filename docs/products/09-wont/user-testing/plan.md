# Test plan: Wont

Bars are copied from [`../evals.md`](../evals.md) ("User test"), not made up here. Persona:
[`persona.md`](persona.md). One scenario per top job (S3 = job 1, S2 = job 2, S1 = job 3), plus S4
"time passes" because the product has day logic. The requirement checks R1–R8 in `evals.md` are run
separately; this plan is the persona's real moments.

## How to run the app for testing

- Start: `pnpm -F 09-wont dev` (the dev script sets no port; use the one it prints, usually 3000).
  No keys or env vars. For S4, also test the production build (`pnpm -F 09-wont build && pnpm -F
  09-wont start`).
- Viewport: 390 × 844 (phone), touch targets ≥ 44 px.
- Time zone: run the browser in `Europe/Stockholm` (the owner's assumed zone; it has the 25 Oct
  clock change).
- Seed data:
  - **First run:** clear localStorage for the origin and reload; the intro plays.
  - **Returning user:** two habits, seeded: build "After I wake up, I will get out of bed, goal: up
    by 7:00" and stop "Nicotine pouches" (trigger "after coffee", friction "pouches stay in the
    car", replacement "chew gum"), with 6 kept / clean days before today.
  - **After a miss:** as returning user, with yesterday logged as missed (build) or a slip of size 1
    (stop), today not logged.
  - Seeding is by writing localStorage from the browser console. *The engineer records the storage
    key, the data shape and a ready-to-paste seed snippet for each state here before the test run.*
- Simulated parts: **the clock.** Time can't really pass in a test, so move it: set the system clock
  or override `Date` in the page (e.g. a Playwright clock / `page.clock`), then resume the tab
  *without reloading* where a step says so. Everything else is real.

## Scenarios

Written as the persona's real moments. Each has a success bar.

### S1 · Log this morning's wake-up (job 3)
- **Moment:** 07:02, sitting on the edge of the bed, phone in one hand, half awake. Returning user.
- **Task:** "I'm up. Mark it."
- **Success:** wake-up logged as kept, with the one small celebration, in **≤ 5 s / ≤ 1 tap**,
  without help. Reload: still logged. The main number moves up (e.g. 6 → 7 of the last 7); no motion
  on anything other than this one moment.

### S2 · Set up a new build habit as a commitment (job 2)
- **Moment:** evening at the desk, a few calm minutes, deciding to read every night. Returning user.
- **Task:** "After I brush my teeth, I will read in bed. Goal: 10 pages. Why: I want my evenings
  back from the phone."
- **Success:** the habit is on the board as a card showing anchor, action and goal in **≤ 60 s /
  ≤ 8 taps** (typing counts as one tap per field), without help. Saved text matches typed text word
  for word (trust check). Then edit one word of it: the change sticks and the card's history is kept.

### S3 · Log a pouch slip, then come back the next day (job 1, the riskiest assumption)
- **Moment:** 22:40, had a pouch after dinner with friends, feeling flat and a bit ashamed. Returning
  user. Before the slip, log one urge (and try "ride it out" if it exists; leave it early with one
  tap).
- **Task:** "I had one. Log it honestly." Then the next morning (move the clock to 08:00 next day,
  open the app): "OK. What now?" Log today as clean that evening.
- **Success:** slip saved with its size, the comeback message shows on the next open with **one**
  next step, the clean day after is marked as a comeback, in **≤ 20 s / ≤ 3 taps** for logging the
  slip, without help. **No guilt words** anywhere: none of "broke", "failed", "streak", "reset",
  "lost", "relapse", no red crosses. The clean-day number does not go to 0. Urge, slip and clean show
  as three distinct entries in history.
- Ask afterwards: "Did any of that feel like being punished?" (agent proxy for the owner's guardrail).

### S4 · Time passes: a week with two misses
- **Moment:** the same person over a week. The app stays open in a background tab and is resumed
  *without a reload* unless a step says "reload".
- **Steps (set the clock for each):**
  1. **Bedtime after midnight:** Thursday 22 Oct 00:30, log "read 10 pages" as kept. It belongs to
     *Wednesday 21 Oct*; Thursday is still open. Also try 03:59 vs 04:00 *(assumed 04:00 day boundary, see
     the brief's day rules)*.
  2. **Clean day only counts once over:** Thursday 21:00, tap clean on pouches: the clean-day number
     does not include Thursday yet. Resume at Friday 08:00: it does.
  3. **Slip after a clean tap:** Friday 20:00 tap clean, 23:00 log a slip: Friday is not a clean
     day.
  4. **Two misses in a row:** Saturday 24 and Sunday 25 Oct wake-up missed (25 Oct is the clock
     change, a 25-hour day). Monday 26 Oct 07:05, resume: one comeback message (not two); log kept: Monday marked as
     the comeback, Sunday not.
  5. **A day with no log:** skip Tuesday 27 Oct entirely; Wednesday 28 Oct 08:00, resume: the comeback message
     shows; Tuesday shows as "not logged" in history, counts as not kept in the rate, and is not
     shown as a failure *(assumed rule, see the brief)*.
  6. **Month end:** Sunday 1 Nov 00:30, log a bedtime habit: it lands on Saturday 31 Oct.
  7. Reload, then compare.
- **Success:** **numbers right, history intact.** With the seeded kept days before, wake-up reads
  "5 of the last 7" after Monday's log and "4 of the last 7" on Wednesday after the unlogged
  Tuesday (dents, never 0); the clean-day count equals the clean, finished, slip-free days;
  every log from steps 1–6 is in history on the right day; nothing changed on reload; the first-ever
  day of a new habit shows no comeback.

## Value questions

- Which parts would this persona use daily (S1 and the evening log), weekly, never? Is "ride it out"
  used or skipped?
- After S3: would they open the app the morning after a slip, or avoid it? What in the message made
  the difference?
- Can they see progress building over the week (S4) without a streak? Does "5 of the last 7" read as
  a dent or as failure?
- Does the board feel like big cards on a drawing board, or like a checklist?
- What's missing that would make them come back tomorrow?

## Trust checks

- After S2 and S3, compare what's saved with what was typed (habit wording, slip size), word for
  word.
- After S4, compare every seeded and logged day with history: right day, right type, nothing lost.
- No item from the kickoff pack's "Things to avoid" visible on any screen in any scenario.

## Out of scope

Notifications, reminders, weekly review, automaticity check, accounts and sync (not built). The
intro animation's craft is judged by the design critic, not here (R1 is checked in `evals.md`).
Editing days older than yesterday. Desktop layout.

## Seeding

Data lives under the localStorage key `wont:v1` (one JSON object: `version`, `habits`, `logs`
keyed habit → day `YYYY-MM-DD` → `{ kept | clean | slip {size, at} | urges[] }`, `comebacksSeen`,
`introSeen`). Code: `apps/09-wont/src/lib/seed.ts` (states), `store.ts` (key, migration).
Every state is built relative to the current clock, so set the clock first, then seed.

- **From the URL:** open the app with `?seed=<name>`, e.g. `http://localhost:3000/?seed=after-miss`.
  The state is written once and the parameter is removed from the address bar.
- **From the console:** `wontSeed("after-miss")` (available once the Today screen has mounted).
- **Clear everything:** `localStorage.removeItem("wont:v1")` and reload (same as `?seed=fresh`).

| Name | What it is | Use for |
| --- | --- | --- |
| `fresh` | Empty, intro not seen | First run, R1 |
| `returning` | Up by 7:00 + Nicotine pouches, 6 kept / clean days before today, today open | S1, S2 |
| `owner-today` | The owner's five habits with the prototype history: Up 5 of 7, Write's comeback due (yesterday not logged), Read, In bed, pouches 2 clean days | Main-screen review, design critic |
| `after-miss` | `returning` plus yesterday: wake-up not logged, a pouch slip of 1; both cards owe a comeback message | S3 second half, R7, R8 |
| `after-slip` | Yesterday: clean tap then a slip of 2 that evening (slip wins); wake-up kept | S3, slip-after-clean rule |
| `week-two-misses` | Wake-up missed the last two days (one comeback message, not two), Read with one older miss, pouches clean | S4 step 4, R7 |

Note: the habit's first day is a grace day. If it is left unlogged, it is neither a miss nor
counted in the rate (so a habit made late in the evening doesn't open with a comeback message).

## v1.1 · Sync between phone and laptop (26 Oct)

Checks S1–S8 in [`../kickoff-v1.1-sync.md`](../kickoff-v1.1-sync.md). Riskiest assumption: **no
data is lost on first sync**.

**Setup.** `pnpm -F 09-wont dev --port 3109`; `apps/09-wont/.env.local` holds the Supabase keys and
two codes. Use **only `SANDBOX_ACCESS_CODE`** (read it from `.env.local`, never print it in the
report); never `ACCESS_CODE`, which opens the owner's real board. The two devices are **two separate
browser contexts** (own localStorage and cookies) on the same server: "laptop" at 1280 × 800,
"phone" at 390 × 844. The sandbox document may hold data from an earlier run: before starting,
reset it with one call that replaces nothing real (the PM does this; graders start from an empty
sandbox). Seeding is refused on a device synced to the owner's board, by design.

### V1 · First connect keeps the laptop's history (riskiest assumption)

The laptop has used Wont since Saturday; the phone has never opened it. Laptop: `?seed=owner-today`,
note every card's number and each habit's 14-day history (⋯ → habit screen). Footer → "Use on
another device" → type the code → Turn on sync.
**Bar:** after connecting, every number and history day on the laptop is exactly as before; nothing
flickers to empty.

### V2 · The empty phone gets everything

Phone: fresh context, intro (Skip), empty board. Footer → type the code.
**Bar:** within a few seconds without a reload the phone shows the same habits, numbers, week
strip and 14-day histories as the laptop.

### V3 · A morning tap on the phone, seen on the laptop

Phone: tap "Up by 7:00" kept. Laptop: switch back to the tab (focus) or reload.
**Bar:** the tap shows on the phone at once (no wait, no spinner); the laptop shows it after focus
or reload; undo on the laptop disappears on the phone after its next focus.

### V4 · Offline tap, then reconnect

Phone: go offline (`context.setOffline(true)`), tap pouches "clean so far" and log one urge. The
footer reads "Offline, saved here". Laptop: meanwhile tap a different habit kept. Phone back
online.
**Bar:** the offline taps show at once and survive a reload while offline; after reconnecting both
devices show all three changes; nothing duplicated or lost.

### V5 · Wrong code and turning sync off

A third context types a wrong code; then the phone taps "Stop syncing on this device".
**Bar:** wrong code says so plainly and changes nothing; turning off keeps the phone's board as it
was.

**Trust checks (sync).** After V4, compare every habit-day on both devices with each other and
with the laptop's notes from V1: equal, nothing lost. The browser never receives a Supabase key
(search network responses and page source for `sb_secret`/`SUPABASE`).
