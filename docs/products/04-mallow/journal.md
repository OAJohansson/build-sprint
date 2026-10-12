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
