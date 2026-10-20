# Backlog

| Idea | Why | Status |
| --- | --- | --- |
| Reminders and notifications (dose, check-in, relief) | The biggest lever against drop-off; parked by the owner for the MVP | Later |
| Clinic view across patients (Montu's outcome evidence) | The business wants to know how treatment helps people manage long-term conditions | Later: a second product |
| Download the summary as a PDF for the doctor | Cut from the MVP (owner, 12 Oct): the summary is shown on screen for now | Next |
| Share the summary with the clinic directly | Sam shows it on screen today | Later |
| Validated questionnaires monthly (GAD-7, SQS; EQ-5D-5L needs a licence) | What clinicians and the registry trust | Later |
| Before/after symptom scores per dose | More precise per-dose evidence; more taps | Maybe |
| Supply and reorder estimate, linking to the clinic's Repeats (schedule itself moved into v2) | Montu already reminds about reorders; the schedule makes an estimate possible | Later (v2 out of scope) |
| Sync across devices / accounts | Data lives on one phone today | Later |
| "Since you started" strip in Journey: one word per symptom per appointment period, relief share per period (user test) | Answers "is it working, and since when?" in one glance | Next |
| Save a partial check-in on a flare day (user test F7) | Today the button says "2 to go"; saving part of it may be kinder on bad days | Maybe |
| A small payoff after saving ("Sleep this week: better than last month") (user test) | A reason to come back tomorrow without a reminder | Maybe |
| Add a standard "time passes" step to test plans (resume, midnight, appointment date) | Two of four majors only showed up that way | Process (retro) |
| Questions for my appointment: notes at the top of the summary | Patients forget what they meant to ask in 15 minutes | Next (after v2) |
| Seizure diary (counts and types) | Different data shape; mostly licensed Epidyolex under neurology care | Later (v2 out of scope) |
| Simulated user test of v2 as Priya (then a real patient): can she read "is it changing?" from the graph in a call? | The main v2 signal is untested | Next |
| A check-in made after midnight (e.g. 00:30) is saved on the new calendar day, while doses follow the 04:00 plan day | Night owls may log "today" for the wrong day | Maybe |
| Calendar shading by grade (design critic called it a louder second chart; owner kept it as "Your days") | Revisit if a user test confuses it with the graph | Maybe |
| "Changed on" date for an amount change (today it's always the day it's entered) | Patients update the app late | Later |
| Selvedge's `vercel.json` still has the old skip check | Its deploys can fail like Mallow's did | Do before Selvedge ships |
| Accessibility pass: move and trap focus in sheets and cards (or `<dialog>`), arrow keys for radio groups, calendar cells ≥ 44 px at 320, a ring on "None" days (audit 15, 21–23) | Keyboard and screen-reader users | Next |
| "Since starting" stretched by a medicine stopped long ago; max lengths on name and rule inputs (audit 28–30) | Edge cases | Later |
