# Journey

What happened, what was decided and why. Newest last.

## 12 Oct · Day 4

### Picking the problem
- Two open problems: "one place to stay on track" (Claude's recommendation: owner is the user) and
  symptom tracking for medical cannabis patients (from the Montu UK interview prep). **Owner chose
  the cannabis tracker.**

### Discovery: today's alternatives (15-minute timebox)
- **Montu UK** (clinic brand Alternaleaf): £29 per video follow-up or £5 a month, patient login,
  reorder reminders. No symptom tracking on the public site, only a side-effects PDF. Job ads say
  15-minute consultant slots, with nurses and pharmacists doing follow-up tasks.
- **UK Medical Cannabis Registry / T21:** validated PROMs (pain, SQS sleep, GAD-7, EQ-5D-5L, PGIC)
  at 1, 3, 6 and 12 months; heavy drop-off (about 2,300 → 200 patients).
- **Calyx** (Grow Pharma) already tracks symptoms and medication, so "a tracker" isn't the edge.
- **Coaching:** "two-sided" in the idea note was a solution, not the problem. The problem is a
  patient walking into a 15-minute call with only memory.

### Decisions
- **Patient side, plus a summary** for the follow-up (owner). No clinic dashboard.
- **A few simple scales** (owner), not full questionnaires (long; EQ-5D-5L is licensed).
- **Moment of use:** owner chose not to fix it now; notifications later. Noted the consequence:
  the check-in can't rely on a daily ritual, so not checking in becomes a value risk.
- **Imagined persona** (owner): Sam, 44, fibromyalgia.
- **Name: Mallow** (owner), after two rounds of options. The first round ("Good Days", "Ease")
  felt too expected; owner asked for something less expected. Mallow is a soothing plant. Brand:
  its green, purple and white. Coaching note: in health, a name is part of the claim, so describe
  a feeling, not a promised result (MHRA rules on promoting prescription-only medicines).
- Draft [brief](#04-mallow.brief) written for the owner to react to.

### Owner's MVP and references
- **Owner's framing:** Montu UK wants to know how its treatment helps people manage long-term
  conditions; the patient wants to know how the medicine helps their mood and symptoms (pain, low
  mood, anxiety). So: log when, how and how much they take, log symptoms, and log how they feel
  after a dose. Stickiness: tell Sam in the app that logging helps the doctor give better care.
  A PDF of the summary for the doctor. Sam sets the last appointment date.
- **References:** screenshots of Vinehealth, the cancer companion app the owner worked on
  (symptom grades with plain descriptions, "last time you mentioned…", prioritised symptoms,
  reports for appointments, a coloured monthly calendar, accessibility for vision and cognition).
  Inspiration only; the owner asked for something creative and beautiful.
- **Coaching:** the MVP grew from a check-in plus summary to five parts. Kept the dose-to-relief
  link because it answers the real question (a daily trend shows *that* things changed, not
  *whether the medicine did it*), but made each part tiny. Montu's view across patients is a
  second product (backlog).
- **Decisions (owner):** relief is one tap, asked the next time the app opens (works without
  notifications; mirrors PGIC, which the registry collects). Sam sets the last *and* next
  appointment (summary range plus countdown). A real PDF made on the phone, nothing uploaded.
- Not borrowed from Vinehealth: many tabs and articles, a colour per screen, emoji faces,
  red/green days (they'd make a bad week feel like a report card).

### Three directions (prototype)
- `/prototype` on the home screen, at `/prototypes/home` behind a picker, with demo data for Sam
  (12 Oct, 9 days to Dr Patel, 18 of 21 days logged, last night's dose not yet rated).
- **Ritual** (interaction model): one calm question at a time; the app leads. **Journal** (layout):
  the day as a timeline, everything answered in place, a dot strip of the month between
  appointments. **Garden** (personality): a mallow that grows a leaf per logged day and flowers on
  appointment day; a missed day adds nothing.
- Shared across all three: plain-word grades with a four-bar intensity mark (no faces, no
  red/green), relief as one tap, a summary preview sheet. Waiting for the owner's pick.

### Round 2: Garden, medicine, Journey
- **Owner picked the Garden**, but without the explanation: "it sounds odd that the flower blooms
  when you see your doctor." The plant is now an unexplained quiet delight (a leaf per logged day,
  the bud opens on appointment day); the purpose is said plainly instead: "9 days until you see
  Dr Patel · What you log here is what they'll see."
- **Owner: add a medication flow.** Added first-run setup (why Mallow exists → medicine → what to
  track → appointments) and a Care tab to add, edit or stop a medicine (form → name and strength
  as on the pharmacy label → usual amount and when). More than one product is allowed (an oil
  daily plus flower for flare-ups). Logging a dose: pick the medicine (1 tap), or change the
  amount or time.
- **Owner: a history section called "Journey"** (patients' own word for getting better). The app
  now has three tabs: Today, Journey, Care. The picker compares three Journey directions:
  **Timeline** (days by week, tap to open), **Calendar** (a month shaded by one symptom's grade),
  **Chapters** (each stretch between appointments, with trend lines and "better than last
  chapter"). The summary for Dr Patel sits on top in all three.
- Demo history is now generated (11 weeks, three appointments, a few missed days and notes), so
  summaries and trends are computed rather than typed in.

### Calendar chosen; prototype promoted
- **Owner chose the Calendar** for Journey: a month shaded by one symptom's grade (deeper mauve =
  harder day, never red/green), appointments marked, tap a day for its doses, relief and notes.
  Timeline and Chapters were dropped (Chapters' "better than last chapter" lives on in the summary).
- Kept by default (owner didn't object): tabs **Today · Journey · Care**; the bloom on
  appointment day stays an unannounced surprise.
- **Promoted into the real app** and the prototype surface deleted: real dates and times, data in
  localStorage, first-run setup (with an optional doctor's name), relief asked about doses taken an
  hour or more before the app was opened, appointments roll over once the day has passed.
- **Demo data is kept apart from real entries** (separate storage keys, a "Demo data · tap to
  leave" band), meeting requirement 9: trying the demo never touches real data.

### Live, and the PDF cut
- **Live** at https://mallow-omega.vercel.app (`pnpm ship 04-mallow`, no env vars).
- **Owner cut the PDF download from the MVP:** the summary in Journey ("For Dr Patel · Summary")
  is enough to show in the call. PDF moved to the backlog as the next thing.
- **Appointment-day card** (owner agreed): the day before and the day of the appointment, Today
  shows "Your appointment is today/tomorrow" with "Open your summary", so the main job comes to
  Sam instead of sitting a tab away.
- Checking the summary's real numbers found two wording bugs, fixed: "Dizzy on 1 days", and
  "Moderate → moderate · A little better" (both periods round to the same word while the average
  moved), now "Mostly moderate · A little better".

### Checks and the simulated user test
- **Design audit:** heading on Today, live region for "Noted", sheets contain their scroll,
  balanced headings. Title Case and "…" placeholders declined (house style).
- **break-ui** with worst-case data: 8 breaks fixed, including small phones hiding the main
  buttons, "1 puffs", long names, a first summary reading "– → moderate", and a missing note
  field in the check-in (a brief requirement only the demo had covered).
- **Simulated user test (Sam):** all bars met except setup (~80 s vs 60 s); 17 of 17 summary
  numbers matched by hand; 0 health claims; no data left the phone. 4 majors found, two of them
  only visible when time passes (resume without reload, an appointment date passing).
- Quick fixes straight away (wrong dose named in the relief confirmation, relief question not
  re-checked on resume, ties rounded up, Save disabled without reason, plurals, contrast).
- **Owner's calls on the rest:** ask on Today when an appointment date passes (no silent
  rollover); **full editing** of doses and past days; medicine lines and comparison dates in the
  summary. All three built and verified.

### Wrap-up
- Owner too tired for the phone review; **wrapped up with the simulated test's numbers** and added
  the own review plus one real patient as a to-do. Success check, retro (reflections marked as
  drafts), interview story and learnings written; card set to shipped.
- **Process changes** (made now, before the next product): ship the empty starter in the first
  hour; a "time passes" scenario in every test plan; walk the brief on a fresh install before testing.
- New problems added to the list while waiting for the deploy: food research while travelling, and
  a quick, pleasant book log.

## 20 Oct · v2 rebuild

### The v2 brief
- **Owner wrote a v2 rebuild brief** (two days): conditions beyond pain, a before-treatment
  baseline, My plan with a medicine history, Today following the plan, "Know your medicine"
  cards, and a trend graph per symptom with a medicine strip as the new main screen.
- **Decision: lift two v1 no-gos** (medication schedules, educational content). Why: research
  showed patients pick products with little guidance (CQC on Alternaleaf), Montu's tools don't
  track doses or show change, and retention is how a clinic that can't advertise grows.
- **Decision: evidence comes from the daily log, not from asking.** Per-dose relief becomes
  optional and is only used to tell apart medicines taken in the same weeks. The app shows
  change next to what was taken and never says the medicine caused it.
- Written up as a v2 section in the brief before code; out-of-scope items moved to the backlog.
- **Scope re-cut said out loud:** stop line for day 2, cut in order: "Other forms" cards, the
  3-month range, amount-change markers. The graph, the strip, the summary and the guardrails stay.

### Owner's calls before code
- **Goal 1 reworded** to "understand the medicine I've been prescribed, and know what to ask my
  doctor". Coaching: "options" promised a choice the guardrails don't allow.
- **Midnight:** a bedtime dose after midnight counts toward the previous night (schedule day ends
  about 04:00). **Relief:** a quiet line per medicine in the summary when medicines overlap.
  **Setup:** one medicine's essentials only; the rest in Care, to hold 90 s.
- Next: branch `04-mallow-v2` from main (keeps the uncommitted 08 Selvedge work out), then day 1.

### Day 1 build: conditions, before treatment, My plan, Today follows the plan
- Branch `04-mallow-v2` from `origin/main` (local main was behind). Vitest added (v1 predated
  decision 0011).
- **Data:** 4 new symptoms (Appetite, Muscle spasm, Concentration, Period or pelvic pain), a
  condition → suggested symptoms list, a before-treatment grade per symptom, and each medicine now
  carries `startDate`, `stopDate` and `changes` (the first entry is the starting amount). v1 data
  is upgraded when read (`migrate`): a medicine starts at the first appointment or its first dose,
  whichever came first. Checked in the browser with a real v1 store.
- **Schedule:** a plan day runs 04:00 to 04:00 (owner's call); a ticked dose keeps its slot, so a
  bedtime dose at 00:30 counts for last night. 19 unit tests (schedule, history, migration).
- **Setup:** welcome → condition → suggested symptoms → before treatment → one medicine
  (with a start date) → appointments. Fresh install walked: about 14 taps plus the name.
  "Skip" on before-treatment made a quiet secondary button, so the starting point isn't skipped
  by default.
- **Care:** My plan ("As your doctor prescribed"), how to take it and the as-needed rule, history
  line ("Since 25 Sep · changed 20 Oct"), stop keeps the history (a medicine added today by mistake
  is removed instead), stopped list, before-treatment editing.
- **Today:** "Your plan today" with 1-tap ticks, "Now / Later / Not taken" in the same grey (no
  red, no streaks); as-needed via "Took a dose" (as-needed medicines first, their label rule shown).
  **Relief made optional:** the prompt only appears when more than one medicine is in use (the
  only thing relief is used for), with "Not now" for the day. Claude's call, flagged to owner.
- **Guardrail near misses fixed:** example hints "With food" and "Slow puffs" read as advice
  (now "By mouth", "With my vape pen"); name and strength placeholders looked like real products
  ("Flower T22", "THC 22%"), now "As on your label".
- **Noticed for day 2:** with a two-slot plan the Took a dose / check-in buttons fall below the
  fold on a 375 × 812 phone; look at it with break-ui.

### Ship blocked: Vercel skip check (fixed for every app)
- `pnpm ship 04-mallow` failed, and had been failing since 19 Oct: the `ignoreCommand` crashed
  ("bad object") when the previous deploy's commit wasn't in Vercel's clone, so the build errored
  instead of running. The script also deploys GitHub's main, so v2 has to be merged first.
- **Owner chose the proper fix:** a missing earlier commit now means "build". Applied to every
  committed app and the template (Selvedge's uncommitted copy still has the old line); decision
  0016 corrected. Merging rebuilds each app once, since every app folder changed.
- **Day 1 live** (20 Oct): PR 37 merged by Claude at the owner's request, `pnpm ship 04-mallow`
  READY at https://mallow-omega.vercel.app. Checked on the live site at phone size: the new setup
  (condition step) and the demo's plan and optional relief prompt; no console errors; only the
  app's own static files are requested.

## 20 Oct · v2 day 2

### Is it working? Graph, medicine strip and summary
- **Owner's brief for the graph:** in the 10 seconds of a video call it must be obvious how the
  symptom has been changing and what medication the patient was on. Coaching: "design for the
  decision" (Tufte's data-ink, Few): the change leads, medicines sit beneath on the same time axis.
- **Owner chose the light design path** (build with the dataviz skill, then the design critic)
  over a full /design-session: the chart's form was mostly fixed by the brief.
- **Trend logic** in `lib/mallow/trend.ts`: daily series, 7-day average that is a gap with fewer
  than 3 check-ins (never a zero), ranges as fixed day counts (28, 91, since the first medicine),
  comparison with the same length before and with before treatment, the plain-words line, the
  medicine bars. 11 more unit tests (30 in all), including a month end and empty history.
- **Claude's call, flagged:** harder grades at the top, so "pain is lower" reads as the line going
  down (how clinicians read symptom charts).
- **Critic round 1: 5/10.** Top gaps: daily dots read as bands over months; green appointment dots
  break the no-green rule; the change marker looked like a slider; a tall before box; two
  disagreeing day counts. All fixed (dots only over 4 weeks, ink ticks with a key, the bar steps up
  at a change, a short before band, the card no longer counts days).
- **Critic round 2: 5/10** (not rising, so stopped and showed the owner). Taken: the takeaway
  sentence above the graph; name and amount on one line ("Balanced oil · 0.5 ml → 0.7 ml");
  as-needed use as dots, not ticks; the picked day written as a nurse would. Bug found on the way:
  the readout listed as-needed medicines on days they weren't used.
- **Owner's calls at the checkpoint:** graph first (the summary becomes a slim row under it); keep
  the calendar below as "Your days" (it's where past days are edited); keep the before band on the
  left, as the brief says, rather than a dashed line across the plot.
- **Summary (requirement 6):** each symptom compares with the stretch before *and* with before
  treatment ("Before treatment: severe. Now: better."); medicines in use with amount changes,
  starts and stops; as-needed shown as days used; relief only when more than one medicine was
  taken. Hand count on Sam's demo: every value matched.
- **Demo rebuilt:** Sam (4 months, oil 0.5 → 0.7 ml at the third appointment, flower on flare days)
  and Priya (3 months, vape added halfway); missed days, a week away, bad days, baselines; switch in
  Care ("Demo: Sam / Demo: Priya").

### Know your medicine, guardrail check, time passes
- **Cards** for oil, flower, vape and capsule (`lib/mallow/forms.ts`, all copy in one file):
  what it is, how it's taken, when it starts and how long it lasts (typical ranges plus "varies
  from person to person"), common side effects (THC and CBD, general), storing it, driving and
  travel, and 4 questions for the doctor. The only dose on a card is the patient's own, from My
  plan, under "Your plan", with "Questions about your dose go to your doctor or pharmacist".
  Own forms first, others under "Other forms"; reached from Care and from each medicine.
- **Guardrail check of every new string.** Breach fixed: the heading "How quickly it **works**"
  (now "When it starts and how long it lasts"). Near misses, kept and why:
  - "Because it starts slowly and lasts a while, oil is often part of a regular daily plan" and
    "flower is often prescribed for times when a faster effect is needed, like flare-ups": describe
    how forms are prescribed, not what to take; no condition named.
  - "If you feel drowsy, dizzy or slowed down, don't drive": an instruction, but road safety and UK
    law, not a dose.
  - "Effects come on slowly, so they can build up later than you expect": a fact about onset;
    deliberately not "don't take more".
  - "What's the most I should use in a day?": a question *to the doctor*, not an answer.
  - v1's anxiety grade "Couldn't do things because of it": "because" refers to the anxiety.
  - Changed earlier on day 1: "With food", "Slow puffs" (advice-like hints), "Flower T22" and
    "THC 22%" placeholders (looked like real products and strengths).
- **Time passes, with a fake clock in the browser** (no reload): 23:50 bedtime "Now"; 00:30 still
  last night's, the tick stored on the real date; 04:10 a new plan day; the day after the
  appointment the "Did it happen?" question appears; a vape added halfway shows in the graph and
  first in "Took a dose". Found and fixed: "1 quick questions"; the "Noted…" line stayed after the
  plan day ended; Next sat against the field in the full-screen medicine flow (v1).

### Simulated user test as Priya (playbook step 3b)
- **Why now:** v2 had tests, a critic and an audit but no user test; the open question was whether
  the graph is read correctly in the 10 seconds of a call.
- **Set-up:** new persona Priya (31, anxiety and poor sleep, oil at night, vape added halfway) next
  to Sam; a v2 plan (setup ≤ 90 s, 1-tap tick, ≤ 2-tap vape, check-in, Journey read ≤ 60 s, Know
  your medicine, time passes). Run on PR 38's head, phone size. The first run lost its dev server
  (the app stops it when the session's turn ends); the second ran in the foreground.
- **Result:** logging and guardrails pass (0 breaches, 9/9 numbers exact, 0 causal words). Main
  signal only partly met: ~50 s, sleep and the medicines read correctly, but the caption above the
  graph ("anxiety mostly quite. Before treatment: quite") made a real improvement read as "no
  change". Priya linked the anxiety drop to the vape herself; the screen doesn't say it.
- **Checked before logging:** the agent's major "00:30 dose saved to the wrong day" was wrong
  (the code counts it for last night, as decided); kept as a labelling issue (feedback 38).
- **Nothing in the product changed.** Owner's calls listed in feedback 34–37.
- **Owner's calls on the test** (20 Oct): 34 caption as then → now in the Summary's words, no date
  (a date beside the vape start would invite "the vape did it"); 35 label both Summary comparisons
  ("since last visit" / "since before treatment"); 36 amounts start blank and required (a default
  is a nudge, and the guardrail is no suggested doses); 37 rough quick picks for unknown dates
  instead of guesses, and "Add another" at the end of setup. Not built yet.
