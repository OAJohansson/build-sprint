# Test plan: Mallow

The v1 plan (Sam, 12 Oct) is kept at the end for reference. The current plan is v2, with Priya.

# v2 (Priya, 20 Oct)

## How to run the app for testing

- Start: the session runs the dev server (`preview_start` "04-mallow", i.e.
  `pnpm -F 04-mallow dev --port 3004`) at `http://localhost:3004`. No env vars, no backend.
- Viewport: 390 × 844 (phone), deviceScaleFactor 2, touch on.
- Chromium: `~/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/` (macOS). Install
  `playwright-core` with pnpm in the scratch folder if it isn't available.
- Seed data:
  - **Fresh install** (S1): a new browser context, empty localStorage.
  - **Demo: Priya** (S2–S6): from a fresh install, finish or skip setup, then Care → "Demo: Priya".
    Three months: balanced oil 0.3 ml at bedtime throughout; a vape (up to 3 puffs when anxious)
    added about halfway; a week away; a few bad days; before-treatment answers; next follow-up in
    4 days. The demo band at the top says "Demo data: Priya". Leave the demo afterwards.
- Simulated parts: the follow-up call (the tester plays Priya, then Dr Okafor looking at the
  screen). "Time passes" (S6) is simulated by moving the browser clock forward with Playwright's
  `page.clock` (no code changes), then reloading or re-focusing the page.

## Scenarios

### S1 · Fresh-install setup
- **Moment:** Sunday evening, just back from the clinic's email suggesting a tracker. Fresh install.
- **Task:** "Set it up for me: my condition, how I was before, my oil, my vape, my next follow-up."
- **Success:** at home (Today) in ≤ 90 s, without help; every step skippable; nothing asks for a
  dose recommendation or suggests one.

### S2 · Tick the bedtime dose (Demo: Priya)
- **Moment:** in bed, lights low, just took the oil.
- **Task:** "Tick it off."
- **Success:** 1 tap; it's obvious it was saved; nothing judges a missed day.

### S3 · Log the vape (Demo: Priya)
- **Moment:** on the train, on edge, took two puffs.
- **Task:** "Note that I used the vape."
- **Success:** ≤ 2 taps; confirmation is visible; nothing comments on how often she uses it.

### S4 · Check-in (Demo: Priya)
- **Moment:** evening, a so-so day.
- **Task:** "Say how today was."
- **Success:** ≤ 30 s, no typing needed.

### S5 · The follow-up: read the change (main, Demo: Priya)
- **Moment:** two minutes before the video call. Then: Dr Okafor sees the phone screen.
- **Task:** open Journey and, from Journey alone (graph, medicine strip, summary row; no Care, no
  day detail), say:
  1. Has her **sleep** changed since she started? Better, worse or the same, and roughly when.
  2. Has her **anxiety** changed since she started? Better, worse or the same, and roughly when.
  3. What was she taking, and when did that change (the vape starting)?
- **Success:** all three answered correctly in ≤ 60 s from opening Journey; the app itself uses no
  causal words ("because of", "worked", "helped your sleep"). Record exactly what she says, and
  whether she reads the vape start as the cause.
- Tester's ground truth (hide from the persona's reasoning): sleep improved over the first ~6
  weeks and then stayed better; anxiety eased slightly, then more from about the time the vape was
  added; the oil is unchanged at 0.3 ml throughout.

### S5b · Know your medicine: the vape (Demo: Priya)
- **Moment:** after the call, wondering "how long does a vape last, can I drive after?".
- **Task:** find the facts about her vape.
- **Success:** found in ≤ 3 taps; answers when it starts, how long it lasts and driving; no dose
  advice or product suggestions; her own plan shown as hers.

### S6 · Time passes (Demo: Priya)
- **Moment:** the follow-up was 4 days away. Move the clock past it (and across a midnight).
- **Task:** open the app the morning after the appointment, then at 00:30 that night.
- **Success:** the app asks calmly whether the appointment happened, nothing resets or vanishes by
  itself, Today's bedtime dose belongs to the right day, and the graph still draws.

## Value questions

- Does Journey make Priya feel ready for the call? Would she show the screen to the doctor?
- Does the medicine strip read as "what I was on", or as the app saying the vape caused the change?
- Does anything make her feel judged for using the vape more on some weeks?
- Would she open Know your medicine again, or is once enough?
- What would Dr Okafor still ask that the screen doesn't answer?

## Out of scope

Notifications, sending to the clinic, accounts and sync, medical accuracy of the cards, Sam's
scenarios (covered on 12 Oct).

---

# v1 (Sam, 12 Oct)
### How to run the app for testing

- Start: `pnpm -F 04-mallow dev` (no env vars, no backend).
- Viewport: 390 × 844 (phone).
- Seed data: "first run" = cleared localStorage. "Returning user" = load the demo history (about
  six weeks, with a last visit set), then clear it afterwards.
- Simulated parts: the follow-up call itself (the tester plays Sam, then the clinician).

### Scenarios

Written as the persona's real moments. Each has a success bar.

### S1 · First check-in
- **Moment:** evening on the sofa, first time opening the app.
- **Task:** "Log how today was."
- **Success:** check-in saved in ≤ 30 s and ≤ 6 taps, no typing, without help.

### S1b · Dose and relief
- **Moment:** just took the evening dose; two hours later, opens the app again.
- **Task:** "Note that I took it." Later: "Say how it helped."
- **Success:** dose logged in ≤ 2 taps; on reopening, the relief question appears unprompted and
  is answered in 1 tap.

### S2 · Bad-day check-in
- **Moment:** a flare day, tired, one hand free, low patience.
- **Task:** "Just get today down, quickly."
- **Success:** done without help; nothing makes them feel judged (no streak warnings, no red).

### S3 · The follow-up (main)
- **Moment:** the morning of the appointment, demo history loaded; then two minutes before the call.
- **Task:** as Sam, find what to tell the doctor. Then, as the clinician seeing the screen: is it
  working?
- **Success:** in ≤ 60 s from the summary alone, says correctly whether pain and sleep got better,
  worse or stayed the same, says how much the doses helped, and names the most common side
  effect.

### S4 · Coming back after a gap
- **Moment:** after four days without checking in.
- **Task:** "Pick it back up."
- **Success:** the app treats the gap calmly; the chart shows a gap, not zeros; check-in works.

### Value questions

- Would Sam check in without a reminder? What would make them come back tomorrow?
- Does the summary make Sam feel taken seriously, or like a patient being graded?
- What would a clinician want that's missing (dose changes, product names)?

### Out of scope

Notifications, sending to the clinic directly, accounts and sync, medical accuracy of the scales.
