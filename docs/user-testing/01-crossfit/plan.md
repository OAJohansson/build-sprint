# Test plan: CrossFit Log

## How to run the app for testing

- Start: `cd apps/01-crossfit && ACCESS_CODE=t pnpm dev -p 3170`. Without Supabase variables the dev
  server uses an in-memory store, which resets on restart. Access code: `t`.
- Viewport: 390 × 844, deviceScaleFactor 2. Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- **First-run state:** a fresh server, nothing stored.
- **Returning-user state:** seed six weeks of history through the API before the scenario, with
  `x-access-code: t`:
  - `POST /api/pbs` with `{movement, kind, repMax, value, unit, rx, achievedOn}`
  - `POST /api/sessions` with `{date, title, transcript, entries:[{movement, sets, reps, weight, unit, score, rx, note}]}`

  Make it realistic: 3–4 sessions a week, back squat and snatch trending up, one missed week,
  Fran done twice.
- **Simulated parts:**
  - **Mic:** replace `window.SpeechRecognition` and `webkitSpeechRecognition` with a fake whose
    `onresult` you drive with the persona's words. Or type into the note box, which the app also
    supports.
  - **AI parsing:** there's no API key here. Intercept `POST /api/parse` and return what a correct
    parse of the persona's note would be, in the app's schema `{date, title, entries:[…]}`. In one
    scenario, return a slightly wrong parse (one wrong weight) to test fixing a mistake. Judge the
    *flow* around the AI, not its accuracy.

## Scenarios

### S1 · First minute
- **Moment:** Sam just opened the link a friend sent. Will give it one minute.
- **Task:** Understand what the app is for, get in, and add three PBs they know: Snatch 1RM 70 kg,
  Back Squat 1RM 120 kg, Fran 5:10 Rx.
- **Success:** Knows what the app does within 10 s; all three PBs added in ≤ 2 min, no dead ends.

### S2 · Coach calls a percentage
- **Moment:** Mid-class, 30 seconds between sets. Coach: "5 by 3 at 75% of your back squat."
- **Task:** Find the weight to load.
- **Success:** Correct loadable weight (90 kg) on screen in ≤ 3 taps / ≤ 10 s from opening the app.

### S3 · Log today's class
- **Moment:** Straight after class, on a box, 2 minutes.
- **Task:** Log by voice: "Back squat 5 by 3 at 90. WOD was a 12 minute AMRAP of 10 wall balls and
  10 cal row, got 6 rounds plus 4, Rx." The AI misreads the squat weight as 80; Sam must notice
  and fix it.
- **Success:** Saved correctly in ≤ 60 s and ≤ 8 taps after the note is spoken; the wrong weight is
  noticeable and fixable.

### S4 · PB day
- **Moment:** After class, buzzing. Hit a 75 kg snatch.
- **Task:** Log it.
- **Success:** The PB is recognised before saving, celebrated, and the board shows 75.

### S5 · Sunday review (returning-user state)
- **Moment:** Sofa, relaxed, 5 minutes.
- **Task:** Answer: How many times did I train this week? This month? What did I do last
  Tuesday? Is my back squat going up?
- **Success:** Each answer found in ≤ 20 s without guessing.

### S6 · Progress check (returning-user state)
- **Moment:** Same Sunday. "Am I actually getting stronger?"
- **Task:** Find evidence of progress over the six weeks, for lifts, WODs and consistency.
- **Success:** A clear yes/no with numbers, without mental arithmetic across screens.

### S7 · Oops
- **Task:** Delete a session logged on the wrong day, and correct a PB entered wrong.
- **Success:** Both possible, and PBs stay right afterwards.

## Value questions

- Which screens and features would Sam use weekly, and which never?
- What's missing that would make Sam open the app tomorrow?
- **Progress:** can Sam *see* progress (trend, change since X, streaks or consistency) or only
  look up numbers? What would the most valuable progress view be?
- Does anything feel like a spreadsheet or homework?

## Out of scope

Accuracy of dictation and AI parsing (simulated); visual polish beyond clarity; the known feedback
items already in `docs/feedback/01-crossfit.md` (reference them if you hit them, don't re-report).
