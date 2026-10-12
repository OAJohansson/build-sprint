# Interview story: Mallow

*Draft by Claude from the brief, feedback log, test report and retro; edit it into your own words.*

**Headline:** Patients on medical cannabis rebuild a month from memory in a 15-minute follow-up, so
I built a tracker whose real product is one screen for that call: what changed since the last
appointment, and how much each dose helped.

**Themes:** Discovery · Prioritisation · Metrics · Trade-offs

## In 30 seconds

Preparing for a Montu UK interview, I noticed patients prescribed medical cannabis get a short
video follow-up and are asked "how has it been?", so the dose is adjusted on memory. Montu's
public site had no symptom tracking, and trackers already exist, so I didn't build "a tracker". I
built Mallow around the call itself: a dose in one tap, "how much did it help?" in one more the
next time you open it, a short daily check-in, and a summary since your last appointment that a
clinician can read in under a minute. A simulated patient test found every number correct and four
major issues, which I fixed in the same day.

## The story

**Situation.** People on medical cannabis for long-term pain have monthly 15-minute follow-ups. The
clinician asks how it's been; the patient answers from memory, coloured by today. UK registries
collect validated questionnaires, but only every few months, and patients drop off fast.

**Task.** In a day, help a patient walk into the call with evidence instead of memories. Success
decided up front: the summary answers "is it working?" in under 60 seconds; a dose in ≤ 2 taps,
relief in 1, a check-in in ≤ 30 seconds; correct numbers and no health claims as guardrails.

**Action.**
- **Discovery first:** researched today's alternatives (Montu's site, the UK registry, an existing
  tracker app). The gap wasn't logging; it was the 15-minute conversation.
- **Pushed back on "two-sided":** the patient side plus a summary gives the clinic its evidence
  without building a clinic product.
- **Relief without notifications:** borrowed "last time you mentioned…" from Vinehealth, a cancer
  app I worked on. The next time you open Mallow, it asks how your last dose helped. One tap,
  similar to a measure the registry already uses.
- **Words as claims:** medical cannabis is a prescription-only medicine, so the name and copy
  describe a feeling and show your own data; nothing promises relief.
- **Cut the PDF** to ship: the summary is shown on screen in the call.
- **Tested in order:** an accessibility audit, worst-case data, then a simulated patient.

**Result.** Live at mallow-omega.vercel.app. Dose in 2 taps, relief in 1, check-in in about 20
seconds, summary read in 30–40 seconds; 17 of 17 summary numbers matched a hand count. The test
found four majors, two only visible when time passes: the relief question didn't appear when the
app was resumed rather than reloaded, and a moved appointment silently emptied the summary. I made
the calls (ask on Today when an appointment date passes; full editing of doses) and fixed all four.

**What I learned.** Find the moment the product is for (here, the call), and test what happens
when time passes, not only what happens on one screen.

## Assumptions: what I believed vs what was true

| I assumed | Turned out | How I found out |
| --- | --- | --- |
| The product is a symptom tracker | Trackers exist (Calyx, Bearable); the edge is the summary for the 15-minute call | Today's-alternatives research |
| The clinic side needs its own dashboard | A patient summary already gives the clinic evidence | Pushing back on "two-sided" |
| A PDF is needed for the doctor | Showing the summary on screen is enough for the MVP | Owner's scope cut |
| Opening the app means loading it | On phones it usually means resuming it; the relief question was missed | Simulated user letting time pass |
| Appointments happen on the booked date | Clinics move them; automatic rollover emptied the summary | Simulated user, appointment-moved variant |
| Demo data shows the app works | A required note field existed only in the demo | break-ui with worst-case data |

## Likely follow-ups

- *How would you know if patients keep logging?* Live: days logged per week and the share of doses
  rated; the next step is one real patient for two weeks, then reminders if it drops.
- *How would a clinic use this?* Today the patient shows the summary; next is sharing it to the
  clinic, then a clinic view across patients (outcome evidence for the business).
- *Why plain words instead of scores?* Easier on a foggy day and readable in a short call; the open
  question is whether clinicians trust them, which needs a clinician to test.
- *What about data privacy?* Everything stays on the phone; demo data is kept apart from real entries.

## Theme prompts

- **Discovery:** *Where did the real problem turn out different from the request?* "A two-sided tracker" became "one screen for the 15-minute call".
- **Prioritisation:** *What did I decide not to build, and why?* The clinic dashboard, the PDF, reminders, validated questionnaires.
- **Metrics:** *How did I know it worked?* Taps and seconds per job, 17/17 numbers correct, 0 claims.
- **Failure:** *What did I get wrong, and what did I change because of it?* Logic that ran only on load; silent appointment rollover.
- **Ambiguity:** *Which decision did I make with incomplete information, and how did I reduce the risk?* No real patient: an imagined persona, a simulated test, and a to-do to test with a real one.
- **Trade-offs:** *What did I give up to get something else?* The PDF for shipping today; precision (scores before and after each dose) for one-tap relief.
- **Craft:** *Which detail made it feel great to use?* The unexplained plant that grows a leaf per logged day; plain-word grades.
- **Technical:** *What technical problem did I solve, and how would I explain it simply?* Demo and real data kept apart; re-checking on resume.
- **Working with AI:** *What did AI do well, and where did I have to correct or overrule it?* Claude researched and built; I overruled the explained plant and chose the Calendar over its options.
- **Speed:** *How did I ship fast without lowering the bar?* Cut the PDF, tested in order, fixed majors the same day.

**Evidence:** live app; brief with success check; `user-testing/report-2026-10-12.md`; feedback log (19 items).
